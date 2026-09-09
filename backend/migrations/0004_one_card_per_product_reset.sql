PRAGMA foreign_keys = ON;

-- This prototype-only migration intentionally clears all existing test data.
-- Product records now represent one visible card instead of a standard/imperfect pair.
DROP TABLE behavior_events;
DROP TABLE products;
DELETE FROM study_sessions;

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL UNIQUE CHECK (position > 0),
  category TEXT NOT NULL CHECK (
    category LIKE 's-%' OR category LIKE 'i-%'
  ),
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  unit TEXT NOT NULL,
  original_price_cents INTEGER NOT NULL CHECK (original_price_cents > 0),
  current_price_cents INTEGER NOT NULL CHECK (current_price_cents > 0),
  appearance TEXT NOT NULL,
  quality TEXT NOT NULL,
  condition_a_information TEXT NOT NULL,
  condition_b_information TEXT NOT NULL,
  scenario TEXT NOT NULL,
  source_status TEXT NOT NULL CHECK (
    source_status IN ('not verified', 'verified')
  )
);

CREATE TABLE behavior_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('product_details_opened', 'product_chosen', 'task_completed')
  ),
  product_id TEXT,
  product_kind TEXT CHECK (
    product_kind IS NULL OR product_kind IN ('standard', 'imperfect')
  ),
  occurred_at TEXT NOT NULL,
  elapsed_ms INTEGER CHECK (elapsed_ms IS NULL OR elapsed_ms >= 0),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX idx_behavior_events_session_time
ON behavior_events(session_id, occurred_at);

CREATE INDEX idx_behavior_events_type
ON behavior_events(event_type);

PRAGMA optimize;
