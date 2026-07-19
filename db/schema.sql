CREATE TABLE IF NOT EXISTS channel_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'mock',
  synced_at TEXT NOT NULL,
  metadata TEXT
);
CREATE INDEX IF NOT EXISTS idx_channel_data_channel ON channel_data(channel);
CREATE INDEX IF NOT EXISTS idx_channel_data_metric ON channel_data(metric);

-- 콘텐츠 자산 (블로그 포스트 = 1차 콘텐츠)
CREATE TABLE IF NOT EXISTS content_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'topic_proposed',
  step_data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 승인 대기열 (단계 전환마다 1건 등록)
CREATE TABLE IF NOT EXISTS pending_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  proposed_data TEXT,
  feedback TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  FOREIGN KEY (asset_id) REFERENCES content_assets(id)
);
