ALTER TABLE study_sessions
ADD COLUMN participant_name TEXT NOT NULL DEFAULT '';

DELETE FROM behavior_events;
DELETE FROM study_sessions;
