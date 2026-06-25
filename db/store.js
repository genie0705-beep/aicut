const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'channel_data.db');

let db = null;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

/** Initialize database and create tables if not exist */
function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  getDb().exec(schema);
}

/** Upsert a metric value for a channel. Returns the row id. */
function upsert(channel, metric, value, source, metadata) {
  const syncedAt = new Date().toISOString();
  const stmt = getDb().prepare(`
    INSERT INTO channel_data (channel, metric, value, source, synced_at, metadata)
    VALUES (@channel, @metric, @value, @source, @synced_at, @metadata)
  `);
  const result = stmt.run({
    channel,
    metric,
    value,
    source: source || 'mock',
    synced_at: syncedAt,
    metadata: metadata ? JSON.stringify(metadata) : null
  });
  return result.lastInsertRowid;
}

/** Get the latest value for a specific channel + metric */
function get(channel, metric) {
  if (metric) {
    return getDb().prepare(`
      SELECT * FROM channel_data
      WHERE channel = ? AND metric = ?
      ORDER BY id DESC LIMIT 1
    `).get(channel, metric);
  }
  // Get all metrics for a channel, latest value per metric
  return getDb().prepare(`
    SELECT cd.* FROM channel_data cd
    INNER JOIN (
      SELECT channel, metric, MAX(id) as max_id
      FROM channel_data
      WHERE channel = ?
      GROUP BY metric
    ) latest ON cd.id = latest.max_id
    ORDER BY cd.metric
  `).all(channel);
}

/** Get all data, optionally filtered by channel */
function getAll(channel) {
  if (channel) {
    return getDb().prepare(`
      SELECT cd.* FROM channel_data cd
      INNER JOIN (
        SELECT channel, metric, MAX(id) as max_id
        FROM channel_data
        WHERE channel = ?
        GROUP BY metric
      ) latest ON cd.id = latest.max_id
      ORDER BY cd.metric
    `).all(channel);
  }
  return getDb().prepare(`
    SELECT cd.* FROM channel_data cd
    INNER JOIN (
      SELECT channel, metric, MAX(id) as max_id
      FROM channel_data
      GROUP BY channel, metric
    ) latest ON cd.id = latest.max_id
    ORDER BY cd.channel, cd.metric
  `).all();
}

/** Get the most recent sync timestamp for a channel */
function getLatestSyncAt(channel) {
  const row = getDb().prepare(`
    SELECT synced_at FROM channel_data
    WHERE channel = ?
    ORDER BY synced_at DESC LIMIT 1
  `).get(channel);
  return row ? row.synced_at : null;
}

/** Close the database connection */
function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { init, upsert, get, getAll, getLatestSyncAt, close };
