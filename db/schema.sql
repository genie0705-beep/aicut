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
