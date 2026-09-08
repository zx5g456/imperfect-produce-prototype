PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL UNIQUE CHECK (position > 0),
  category TEXT NOT NULL,
  standard_name TEXT NOT NULL,
  imperfect_name TEXT NOT NULL,
  standard_image TEXT NOT NULL,
  imperfect_image TEXT NOT NULL,
  unit TEXT NOT NULL,
  original_price_cents INTEGER NOT NULL CHECK (original_price_cents > 0),
  current_price_cents INTEGER NOT NULL CHECK (current_price_cents > 0),
  appearance TEXT NOT NULL,
  quality TEXT NOT NULL,
  scenario TEXT NOT NULL,
  source_status TEXT NOT NULL CHECK (source_status IN ('not verified', 'verified'))
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  study_mode TEXT NOT NULL CHECK (study_mode IN ('browse', 'comprehension', 'comparison')),
  condition_code TEXT NOT NULL CHECK (condition_code IN ('A', 'B')),
  scenario_index INTEGER NOT NULL CHECK (scenario_index > 0),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

CREATE TABLE IF NOT EXISTS behavior_events (
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

CREATE INDEX IF NOT EXISTS idx_behavior_events_session_time
ON behavior_events(session_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_behavior_events_type
ON behavior_events(event_type);

INSERT INTO products (
  id, position, category, standard_name, imperfect_name,
  standard_image, imperfect_image, unit,
  original_price_cents, current_price_cents,
  appearance, quality, scenario, source_status
) VALUES
  (
    'carrots', 1, 'Fresh produce', 'Fresh carrots', 'Naturally wonky carrots',
    '/products/standard-carrot.jpg', '/products/imperfect-carrot.jpg', '1 kg bag',
    390, 250,
    'Forked or curved from growing around stones in the soil.',
    'Fresh eating quality — shape only, no damage.',
    'You are buying carrots for a soup tonight. Find the current price and decide whether you need more information.',
    'not verified'
  ),
  (
    'apples', 2, 'Fresh produce', 'Red apples', 'Naturally unique apples',
    '/products/standard-apple.jpg', '/products/imperfect-apple.jpg', '1 kg bag',
    550, 380,
    'Uneven colour or shape from natural growing conditions.',
    'Crisp and ready to eat — appearance only.',
    'You are choosing apples for weekday snacks. Find the price, saving and quality status before deciding.',
    'not verified'
  ),
  (
    'capsicum', 3, 'Fresh produce', 'Red capsicums', 'Naturally quirky capsicums',
    '/products/standard-capsicum.jpg', '/products/imperfect-capsicum.jpg', '500 g pack',
    600, 420,
    'Curved or uneven shape that does not affect taste.',
    'Fresh cooking quality — checked by our produce team.',
    'You need capsicums for dinner and are comparing value. Identify what looks different and what the price covers.',
    'not verified'
  )
ON CONFLICT(id) DO UPDATE SET
  position = excluded.position,
  category = excluded.category,
  standard_name = excluded.standard_name,
  imperfect_name = excluded.imperfect_name,
  standard_image = excluded.standard_image,
  imperfect_image = excluded.imperfect_image,
  unit = excluded.unit,
  original_price_cents = excluded.original_price_cents,
  current_price_cents = excluded.current_price_cents,
  appearance = excluded.appearance,
  quality = excluded.quality,
  scenario = excluded.scenario,
  source_status = excluded.source_status;

PRAGMA optimize;
