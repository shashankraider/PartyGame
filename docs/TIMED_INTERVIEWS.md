# Timed interviews

Each suspect starts with eight minutes of active investigation time. Reading, discussing and composing questions consume that budget. Waiting for a generated response does not. In multiplayer, the microphone moves to the next detective after 90 active seconds; Pass control moves it early. A solo detective keeps the microphone throughout.

The host can pause the game or add two minutes to the current suspect. At zero, new questions stop, while already accepted answers finish. Players can switch suspects and return with the same transcript, admissions, evidence and remaining budget. Switching suspects does not refresh the microphone allowance. Opening research files pauses interview time. Leaving the browser does not pause the game; use the host's Pause control.

The database owns both clocks. Session-row locking serializes submissions, microphone rotation and host actions. A pending answer pauses time until completion or failure; a lost process pauses at most the existing 120-second turn lease, then time resumes. Polling reconciles microphone expiry every 2.5 seconds; submissions also check it on the server. Refreshing or changing devices cannot reset time. New deployments require the timed_interviews migration before the app update.

Legacy case.rules.questionsPerDetective is retained for existing case compatibility but is no longer used by the live game. The current defaults are fixed at 480 / 90 / 120 seconds.

Validation: unit clock projection tests, transactional database checks in tests/integration/interview-clock.sql, and the full local API integration suite. The SQL fixture simulates elapsed time and rolls back all changes. No live LLM calls are needed for timer validation; persona and evidence-gating evals remain separate.
