-- Run against a disposable local database with psql -v ON_ERROR_STOP=1.
-- All fixtures and privileged clock simulation are rolled back.
begin;
do $$
declare s public.sessions; sid uuid; p1 uuid; p2 uuid; turn uuid:=gen_random_uuid(); lease jsonb; budget double precision;
begin
 insert into public.sessions(case_id,case_version,join_code,mode,status,phase,current_scene,current_interview_suspect_id)
 values('mussoorie','1','timer-'||gen_random_uuid(),'multi','in_progress','interrogation','interview','rhea') returning id into sid;
 insert into public.players(session_id,name,seat_number,device_id) values(sid,'One',1,gen_random_uuid()) returning id into p1;
 insert into public.players(session_id,name,seat_number,device_id) values(sid,'Two',2,gen_random_uuid()) returning id into p2;
 update public.sessions set current_interviewer_player_id=p1 where id=sid;
 select * into s from public.tick_interview_clock(sid);
 assert (s.interview_clocks->>'rhea')::float=480,'initial eight minutes';
 -- Simulate 91 seconds without browser polling.
 perform set_config('session_replication_role','replica',true);
 update public.sessions set interview_clock_anchor=now()-interval '91 seconds' where id=sid;
 perform set_config('session_replication_role','origin',true);
 select * into s from public.tick_interview_clock(sid);
 assert s.current_interviewer_player_id=p2,'automatic rotation';
 assert s.microphone_seconds=90,'fresh microphone';
 assert (s.interview_clocks->>'rhea')::float=389,'elapsed time settled';
 update public.sessions set current_interview_suspect_id='naina' where id=sid;
 update public.sessions set current_interview_suspect_id='rhea' where id=sid returning * into s;
 assert (s.interview_clocks->>'rhea')::float=389,'revisit preserves time';
 lease:=public.begin_interview_turn(sid,p2,turn,'test');
 select * into s from public.sessions where id=sid;
 assert s.interview_clock_anchor=now()+interval '120 seconds','answer pauses clock';
 perform public.commit_game_update(sid,s.revision,'{}','[]','[]','[]',null,turn,false,(lease->>'attemptId')::uuid);
 select * into s from public.sessions where id=sid;
 assert s.interview_clock_anchor=now(),'completion resumes clock';
 assert (s.interview_clocks->>'rhea')::float=389,'generation never deducted';
 -- Failed attempts also resume; no permanently frozen clock.
 lease:=public.begin_interview_turn(sid,p2,gen_random_uuid(),'failed');
 update public.interview_turns set status='failed' where session_id=sid and status='pending';
 select * into s from public.sessions where id=sid;
 assert s.interview_clock_anchor=now(),'failure resumes clock';
 update public.sessions set status='paused' where id=sid returning * into s;
 assert s.interview_clock_anchor is null,'host pause';
 update public.sessions set status='in_progress' where id=sid;
 perform set_config('session_replication_role','replica',true);
 update public.sessions set interview_clock_anchor=now()-interval '500 seconds' where id=sid;
 perform set_config('session_replication_role','origin',true);
 begin
   perform public.begin_interview_turn(sid,p2,gen_random_uuid(),'expired');
   raise exception 'Expired interview incorrectly accepted' using errcode='ZX001';
 exception when raise_exception then
   assert SQLERRM like 'Interview time is up%','expiry rejected for correct reason';
 end;
 select * into s from public.sessions where id=sid;
 perform public.extend_interview_clock(sid,s.revision);
 select * into s from public.tick_interview_clock(sid);
 assert (s.interview_clocks->>'rhea')::float=120,'extension gives two minutes after expiry';
 assert s.current_interviewer_player_id=p1,'expired microphone rotates after extension';
 assert not has_function_privilege('authenticated','public.extend_interview_clock(uuid,bigint)','execute'),'extensions service only';
 assert not has_function_privilege('anon','public.tick_interview_clock(uuid)','execute'),'tick service only';
 raise notice 'Interview clock database checks passed';
end $$;
rollback;
