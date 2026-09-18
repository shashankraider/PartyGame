alter table public.sessions add column interview_clocks jsonb not null default '{}', add column interview_clock_anchor timestamptz, add column microphone_seconds double precision not null default 90;

-- Settle elapsed active time before every transition, including suspect changes.
create function public.settle_interview_clock() returns trigger language plpgsql set search_path='' as $$
declare elapsed double precision := 0; remaining double precision; pending_until timestamptz;
begin
 if old.status='in_progress' and old.current_scene='interview' and old.current_interview_suspect_id is not null and old.interview_clock_anchor is not null then
   elapsed := greatest(0,extract(epoch from now()-old.interview_clock_anchor));
   remaining := greatest(0,coalesce((new.interview_clocks->>old.current_interview_suspect_id)::double precision,480)-elapsed);
   new.interview_clocks := jsonb_set(new.interview_clocks,array[old.current_interview_suspect_id],to_jsonb(remaining));
   new.microphone_seconds := greatest(0,old.microphone_seconds-elapsed);
 end if;
 if new.current_interview_suspect_id is not null and not(new.interview_clocks ? new.current_interview_suspect_id) then
   new.interview_clocks := jsonb_set(new.interview_clocks,array[new.current_interview_suspect_id],'480');
 end if;
 if new.current_interviewer_player_id is distinct from old.current_interviewer_player_id then new.microphone_seconds:=90; end if;
 select max(lease_until) into pending_until from public.interview_turns where session_id=new.id and status='pending' and lease_until>now();
 new.interview_clock_anchor := case when new.status='in_progress' and new.current_scene='interview' then coalesce(pending_until,now()) else null end;
 return new;
end $$;
create trigger settle_interview_clock before update on public.sessions for each row execute function public.settle_interview_clock();

-- Turn leases pause both clocks; a crashed request resumes at lease expiry.
create function public.interview_lease_clock() returns trigger language plpgsql set search_path='' as $$
begin
 update public.sessions set updated_at=now() where id=new.session_id;
 return new;
end $$;
create trigger interview_lease_clock after insert or update of status on public.interview_turns for each row execute function public.interview_lease_clock();

create function public.tick_interview_clock(p_session uuid) returns public.sessions language plpgsql set search_path='' as $$
declare s public.sessions; elapsed double precision; next_player uuid;
begin
 select * into s from public.sessions where id=p_session for update;
 if not found then raise exception 'Game not found' using errcode='P0002'; end if;
 if s.status<>'in_progress' or s.current_scene<>'interview' or s.current_interview_suspect_id is null or s.expires_at<=now() then return s; end if;
 if exists(select 1 from public.interview_turns where session_id=p_session and status='pending' and lease_until>now()) then return s; end if;
 elapsed:=greatest(0,extract(epoch from now()-coalesce(s.interview_clock_anchor,now())));
 if s.interview_clock_anchor is null or not(s.interview_clocks ? s.current_interview_suspect_id) then
   update public.sessions set updated_at=now() where id=p_session returning * into s;
 elsif s.microphone_seconds<=elapsed and coalesce((s.interview_clocks->>s.current_interview_suspect_id)::double precision,480)>elapsed then
   select id into next_player from public.players where session_id=p_session and not is_observer and id is distinct from s.current_interviewer_player_id
   order by case when seat_number>coalesce((select seat_number from public.players where id=s.current_interviewer_player_id),0) then 0 else 1 end,seat_number limit 1;
   if next_player is not null then
     update public.sessions set current_interviewer_player_id=next_player,revision=revision+1 where id=p_session returning * into s;
   end if;
 end if;
 return s;
end $$;

create function public.extend_interview_clock(p_session uuid,p_revision bigint) returns void language plpgsql set search_path='' as $$
declare s public.sessions;
begin
 select * into s from public.sessions where id=p_session for update;
 if s.revision<>p_revision or s.status not in ('in_progress','paused') or s.current_scene<>'interview' or s.current_interview_suspect_id is null then raise exception 'Refresh the interview before extending'; end if;
 if exists(select 1 from public.interview_turns where session_id=p_session and status='pending' and lease_until>now()) then raise exception 'Wait for the current answer'; end if;
 -- First settle, then add time. The trigger preserves additions made to the clock.
 update public.sessions set updated_at=now() where id=p_session returning * into s;
 update public.sessions set interview_clocks=jsonb_set(s.interview_clocks,array[s.current_interview_suspect_id],to_jsonb((s.interview_clocks->>s.current_interview_suspect_id)::double precision+120)),revision=revision+1 where id=p_session;
end $$;

CREATE OR REPLACE FUNCTION public.begin_interview_turn(p_session uuid, p_player uuid, p_id uuid, p_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare s public.sessions; t public.interview_turns;
begin
 select * into s from public.tick_interview_clock(p_session);
 if not found then raise exception 'Game not found' using errcode='P0002'; end if;
 if s.expires_at<=now() then raise exception 'Game expired' using errcode='P0003'; end if;
 select * into t from public.interview_turns where id=p_id;
 if found then
   if t.session_id<>p_session or t.player_id<>p_player or t.input_hash<>p_hash then raise exception 'Request ID already used for another question'; end if;
   if t.status='completed' then return jsonb_build_object('completed',true,'result',t.result); end if;
   if t.status='pending' and t.lease_until>now() then raise exception 'Question is still being answered'; end if;
 end if;
 if s.status<>'in_progress' or s.phase<>'interrogation' or s.current_scene<>'interview' then raise exception 'Game is not accepting questions'; end if;
 if coalesce((s.interview_clocks->>s.current_interview_suspect_id)::double precision,480)-greatest(0,extract(epoch from now()-coalesce(s.interview_clock_anchor,now())))<=0 then raise exception 'Interview time is up. Ask the host for two more minutes.'; end if;
 if s.current_interviewer_player_id is distinct from p_player then raise exception 'Only the current interviewer can ask'; end if;
 update public.interview_turns set status='failed' where session_id=p_session and status='pending' and lease_until<=now();
 if exists(select 1 from public.interview_turns where session_id=p_session and status='pending') then raise exception 'Another question is being answered'; end if;
 insert into public.interview_turns(id,session_id,player_id,input_hash,status,lease_until,revision,attempt_id)
 values(p_id,p_session,p_player,p_hash,'pending',now()+interval '120 seconds',s.revision,gen_random_uuid())
 on conflict(id) do update set status='pending',lease_until=excluded.lease_until,revision=excluded.revision,attempt_id=excluded.attempt_id,result=null returning * into t;
 return jsonb_build_object('completed',false,'revision',s.revision,'attemptId',t.attempt_id);
end $function$
;


revoke all on function public.settle_interview_clock() from public,anon,authenticated;
grant execute on function public.settle_interview_clock() to service_role;

revoke all on function public.interview_lease_clock() from public,anon,authenticated;
grant execute on function public.interview_lease_clock() to service_role;

revoke all on function public.tick_interview_clock(uuid) from public,anon,authenticated;
grant execute on function public.tick_interview_clock(uuid) to service_role;

revoke all on function public.extend_interview_clock(uuid,bigint) from public,anon,authenticated;
grant execute on function public.extend_interview_clock(uuid,bigint) to service_role;
