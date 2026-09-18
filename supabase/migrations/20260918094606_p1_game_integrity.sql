create extension if not exists "pg_cron" with schema "pg_catalog";

drop policy "events_select_own_session" on "public"."events";

drop policy "interview_unlock_state_select_own_session" on "public"."interview_unlock_state";

revoke select on table "public"."players" from "anon";

revoke select on table "public"."players" from "authenticated";


  create table "public"."interview_turns" (
    "id" uuid not null,
    "session_id" uuid not null,
    "player_id" uuid not null,
    "input_hash" text not null,
    "status" text not null,
    "lease_until" timestamp with time zone not null,
    "revision" bigint not null,
    "result" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "attempt_id" uuid not null default gen_random_uuid()
      );


alter table "public"."interview_turns" enable row level security;


  create table "public"."session_memberships" (
    "session_id" uuid not null,
    "device_id" uuid not null,
    "player_id" uuid,
    "is_host" boolean not null default false
      );


alter table "public"."session_memberships" enable row level security;

alter table "public"."sessions" add column "endgame_path_id" text;

alter table "public"."sessions" add column "reveal_step" integer not null default 0;

alter table "public"."sessions" add column "revision" bigint not null default 0;

CREATE UNIQUE INDEX interview_turns_one_pending ON public.interview_turns USING btree (session_id) WHERE (status = 'pending'::text);

CREATE UNIQUE INDEX interview_turns_pkey ON public.interview_turns USING btree (id);

CREATE INDEX interview_turns_player_idx ON public.interview_turns USING btree (player_id);

CREATE UNIQUE INDEX session_memberships_pkey ON public.session_memberships USING btree (session_id, device_id);

CREATE UNIQUE INDEX session_memberships_player_id_key ON public.session_memberships USING btree (player_id);

alter table "public"."interview_turns" add constraint "interview_turns_pkey" PRIMARY KEY using index "interview_turns_pkey";

alter table "public"."session_memberships" add constraint "session_memberships_pkey" PRIMARY KEY using index "session_memberships_pkey";

alter table "public"."interview_turns" add constraint "interview_turns_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE not valid;

alter table "public"."interview_turns" validate constraint "interview_turns_player_id_fkey";

alter table "public"."interview_turns" add constraint "interview_turns_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE not valid;

alter table "public"."interview_turns" validate constraint "interview_turns_session_id_fkey";

alter table "public"."interview_turns" add constraint "interview_turns_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))) not valid;

alter table "public"."interview_turns" validate constraint "interview_turns_status_check";

alter table "public"."session_memberships" add constraint "session_memberships_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE not valid;

alter table "public"."session_memberships" validate constraint "session_memberships_player_id_fkey";

alter table "public"."session_memberships" add constraint "session_memberships_player_id_key" UNIQUE using index "session_memberships_player_id_key";

alter table "public"."session_memberships" add constraint "session_memberships_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE not valid;

alter table "public"."session_memberships" validate constraint "session_memberships_session_id_fkey";

alter table "public"."sessions" add constraint "sessions_reveal_step_check" CHECK (((reveal_step >= 0) AND (reveal_step <= 2))) not valid;

alter table "public"."sessions" validate constraint "sessions_reveal_step_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.begin_interview_turn(p_session uuid, p_player uuid, p_id uuid, p_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare s public.sessions; t public.interview_turns;
begin
 select * into s from public.sessions where id=p_session for update;
 if not found then raise exception 'Game not found' using errcode='P0002'; end if;
 if s.expires_at<=now() then raise exception 'Game expired' using errcode='P0003'; end if;
 select * into t from public.interview_turns where id=p_id;
 if found then
   if t.session_id<>p_session or t.player_id<>p_player or t.input_hash<>p_hash then raise exception 'Request ID already used for another question'; end if;
   if t.status='completed' then return jsonb_build_object('completed',true,'result',t.result); end if;
   if t.status='pending' and t.lease_until>now() then raise exception 'Question is still being answered'; end if;
 end if;
 if s.status<>'in_progress' or s.phase<>'interrogation' or s.current_scene<>'interview' then raise exception 'Game is not accepting questions'; end if;
 if s.current_interviewer_player_id is distinct from p_player then raise exception 'Only the current interviewer can ask'; end if;
 update public.interview_turns set status='failed' where session_id=p_session and status='pending' and lease_until<=now();
 if exists(select 1 from public.interview_turns where session_id=p_session and status='pending') then raise exception 'Another question is being answered'; end if;
 insert into public.interview_turns(id,session_id,player_id,input_hash,status,lease_until,revision,attempt_id)
 values(p_id,p_session,p_player,p_hash,'pending',now()+interval '120 seconds',s.revision,gen_random_uuid())
 on conflict(id) do update set status='pending',lease_until=excluded.lease_until,revision=excluded.revision,attempt_id=excluded.attempt_id,result=null returning * into t;
 return jsonb_build_object('completed',false,'revision',s.revision,'attemptId',t.attempt_id);
end $function$
;

CREATE OR REPLACE FUNCTION public.commit_game_update(p_session uuid, p_revision bigint, p_patch jsonb DEFAULT '{}'::jsonb, p_messages jsonb DEFAULT '[]'::jsonb, p_states jsonb DEFAULT '[]'::jsonb, p_events jsonb DEFAULT '[]'::jsonb, p_vote jsonb DEFAULT NULL::jsonb, p_turn uuid DEFAULT NULL::uuid, p_cancel_turn boolean DEFAULT false, p_attempt uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare s public.sessions; t public.interview_turns; item jsonb; seq integer; m public.messages; saved jsonb:='[]'; v_result jsonb;
begin
 select * into s from public.sessions where id=p_session for update;
 if not found then raise exception 'Game not found' using errcode='P0002'; end if;
 if s.expires_at<=now() then raise exception 'Game expired' using errcode='P0003'; end if;
 if s.revision<>p_revision then raise exception 'Game changed. Refresh and try again.' using errcode='PT409'; end if;
 if s.status='finished' then raise exception 'Game has ended'; end if;
 if p_turn is not null then
   select * into t from public.interview_turns where id=p_turn and session_id=p_session;
   if not found or t.status<>'pending' or t.lease_until<=now() or t.revision<>s.revision or t.attempt_id is distinct from p_attempt or s.status<>'in_progress' then raise exception 'Question was cancelled or timed out'; end if;
 else
   update public.interview_turns set status='failed' where session_id=p_session and status='pending' and lease_until<=now();
   if p_cancel_turn then
     update public.interview_turns set status='cancelled' where session_id=p_session and status='pending';
   elsif exists(select 1 from public.interview_turns where session_id=p_session and status='pending') then
     raise exception 'Wait for the current answer before changing the game';
   end if;
 end if;
 if p_vote is not null then
   if s.status<>'in_progress' or s.phase<>'accusation' then raise exception 'Voting is closed'; end if;
   if not exists(select 1 from public.players where id=(p_vote->>'player_id')::uuid and session_id=p_session and not is_observer) then raise exception 'Detective cannot vote'; end if;
   if p_vote->>'suspect_id' is null then
     delete from public.accusation_votes where session_id=p_session and player_id=(p_vote->>'player_id')::uuid;
   else
     insert into public.accusation_votes(session_id,player_id,suspect_id) values(p_session,(p_vote->>'player_id')::uuid,p_vote->>'suspect_id')
       on conflict(session_id,player_id) do update set suspect_id=excluded.suspect_id;
   end if;
 end if;
 for item in select value from jsonb_array_elements(p_messages) loop
   select coalesce(max(sequence),0)+1 into seq from public.messages where session_id=p_session and suspect_id=item->>'suspect_id';
   insert into public.messages(session_id,suspect_id,role,content,asked_by_player_id,presented_evidence_id,sequence,is_streaming)
     values(p_session,item->>'suspect_id',(item->>'role')::public.message_role,item->>'content',(item->>'asked_by_player_id')::uuid,item->>'presented_evidence_id',seq,false) returning * into m;
   saved:=saved||to_jsonb(m);
 end loop;
 for item in select value from jsonb_array_elements(p_states) loop
   insert into public.interview_unlock_state(session_id,suspect_id,condition_id,attempts,pressure_count,max_adjacency,last_reason,met_at,met_via)
   values(p_session,item->>'suspect_id',item->>'condition_id',(item->>'attempts')::integer,(item->>'pressure_count')::integer,(item->>'max_adjacency')::real,item->>'last_reason',(item->>'met_at')::timestamptz,item->>'met_via')
   on conflict(session_id,suspect_id,condition_id) do update set attempts=excluded.attempts,pressure_count=excluded.pressure_count,max_adjacency=excluded.max_adjacency,last_reason=excluded.last_reason,met_at=excluded.met_at,met_via=excluded.met_via,last_evaluated_at=now();
 end loop;
 update public.sessions set
   status=case when p_patch?'status' then (p_patch->>'status')::public.session_status else status end,
   phase=case when p_patch?'phase' then (p_patch->>'phase')::public.session_phase else phase end,
   current_scene=case when p_patch?'current_scene' then (p_patch->>'current_scene')::public.session_scene else current_scene end,
   current_chapter_id=case when p_patch?'current_chapter_id' then p_patch->>'current_chapter_id' else current_chapter_id end,
   current_interviewer_player_id=case when p_patch?'current_interviewer_player_id' then (p_patch->>'current_interviewer_player_id')::uuid else current_interviewer_player_id end,
   current_interview_suspect_id=case when p_patch?'current_interview_suspect_id' then p_patch->>'current_interview_suspect_id' else current_interview_suspect_id end,
   unlocked_evidence=case when p_patch?'unlocked_evidence' then array(select jsonb_array_elements_text(p_patch->'unlocked_evidence')) else unlocked_evidence end,
   endgame_path_id=case when p_patch?'endgame_path_id' then p_patch->>'endgame_path_id' else endgame_path_id end,
   reveal_step=case when p_patch?'reveal_step' then (p_patch->>'reveal_step')::integer else reveal_step end,
   revision=revision+1,last_activity_at=now(),expires_at=now()+interval '7 days'
 where id=p_session returning * into s;
 for item in select value from jsonb_array_elements(p_events) loop
   insert into public.events(session_id,type,payload) values(p_session,item->>'type',coalesce(item->'payload','{}'));
 end loop;
 v_result:=jsonb_build_object('session',to_jsonb(s),'messages',saved);
 if p_turn is not null then update public.interview_turns set status='completed',result=v_result where id=p_turn; end if;
 return v_result;
end $function$
;

CREATE OR REPLACE FUNCTION public.create_game_session(p_case_id text, p_case_version text, p_join_code text, p_mode public.session_mode, p_device uuid)
 RETURNS public.sessions
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare s public.sessions;
begin
  insert into public.sessions(case_id,case_version,join_code,mode) values(p_case_id,p_case_version,p_join_code,p_mode) returning * into s;
  insert into public.session_memberships(session_id,device_id,is_host) values(s.id,p_device,true);
  insert into public.events(session_id,type,payload) values(s.id,'session.created',jsonb_build_object('caseId',p_case_id));
  return s;
end $function$
;

CREATE OR REPLACE FUNCTION public.join_game_session(p_join_code text, p_name text, p_device uuid, p_max_players integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare s public.sessions; p public.players; member public.session_memberships; n integer; observer boolean; existing boolean:=false;
begin
 select * into s from public.sessions where join_code=p_join_code for update;
 if not found then raise exception 'Game not found' using errcode='P0002'; end if;
 if s.expires_at<=now() then raise exception 'Game expired' using errcode='P0003'; end if;
 select * into member from public.session_memberships where session_id=s.id and device_id=p_device;
 if member.player_id is not null then
   update public.players set name=p_name,last_seen_at=now() where id=member.player_id returning * into p;
   existing:=true;
 else
   if s.status='finished' then raise exception 'Game has ended' using errcode='P0001'; end if;
   select count(*) into n from public.players where session_id=s.id and not is_observer;
   observer:=s.status<>'lobby' or n>=p_max_players;
   select coalesce(max(seat_number),0)+1 into n from public.players where session_id=s.id;
   insert into public.players(session_id,name,seat_number,device_id,is_observer)
     values(s.id,p_name,n,gen_random_uuid()::text,observer) returning * into p;
   insert into public.session_memberships(session_id,device_id,player_id,is_host) values(s.id,p_device,p.id,false)
     on conflict(session_id,device_id) do update set player_id=excluded.player_id;
   insert into public.events(session_id,type,payload) values(s.id,'player.joined',jsonb_build_object('playerId',p.id));
 end if;
 return jsonb_build_object('session',to_jsonb(s),'player',to_jsonb(p)-'device_id','existing',existing);
end $function$
;

CREATE OR REPLACE FUNCTION public.current_session_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select case when nullif(auth.jwt()->>'session_expires_at','')::timestamptz>now() then nullif(auth.jwt()->>'session_id','')::uuid else null end
$function$
;

grant delete on table "public"."interview_turns" to "service_role";

grant insert on table "public"."interview_turns" to "service_role";

grant references on table "public"."interview_turns" to "service_role";

grant select on table "public"."interview_turns" to "service_role";

grant trigger on table "public"."interview_turns" to "service_role";

grant truncate on table "public"."interview_turns" to "service_role";

grant update on table "public"."interview_turns" to "service_role";

grant delete on table "public"."session_memberships" to "service_role";

grant insert on table "public"."session_memberships" to "service_role";

grant references on table "public"."session_memberships" to "service_role";

grant select on table "public"."session_memberships" to "service_role";

grant trigger on table "public"."session_memberships" to "service_role";

grant truncate on table "public"."session_memberships" to "service_role";

grant update on table "public"."session_memberships" to "service_role";


  create policy "events_select_safe"
  on "public"."events"
  as permissive
  for select
  to authenticated
using (((session_id = public.current_session_id()) AND (type = ANY (ARRAY['session.created'::text, 'session.started'::text, 'session.changed'::text, 'session.paused'::text, 'session.resumed'::text, 'session.ended'::text, 'player.joined'::text, 'interview.exchange'::text, 'interview.completed'::text, 'session.accusation_set'::text]))));




-- Explicit ACLs and scheduled job are not represented by the schema diff.
revoke all on public.session_memberships,public.interview_turns from public,anon,authenticated;
grant select(id,session_id,name,seat_number,is_host,is_observer,joined_at,last_seen_at) on public.players to authenticated;
revoke execute on function public.create_game_session(text,text,text,public.session_mode,uuid) from public,anon,authenticated;
revoke execute on function public.join_game_session(text,text,uuid,integer) from public,anon,authenticated;
revoke execute on function public.begin_interview_turn(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke execute on function public.commit_game_update(uuid,bigint,jsonb,jsonb,jsonb,jsonb,jsonb,uuid,boolean,uuid) from public,anon,authenticated;
grant execute on function public.create_game_session(text,text,text,public.session_mode,uuid),public.join_game_session(text,text,uuid,integer),public.begin_interview_turn(uuid,uuid,uuid,text),public.commit_game_update(uuid,bigint,jsonb,jsonb,jsonb,jsonb,jsonb,uuid,boolean,uuid) to service_role;
revoke execute on function public.gc_expired_sessions() from public,anon,authenticated;
grant execute on function public.gc_expired_sessions() to service_role;
-- Local and hosted Supabase both support pg_cron. Only expired sessions are removed.
create extension if not exists pg_cron;
select cron.schedule('mystery-expired-sessions','17 * * * *','select public.gc_expired_sessions()');
notify pgrst,'reload schema';
