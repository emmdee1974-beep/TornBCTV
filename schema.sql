CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'SETUP', starts_at INTEGER, closes_at INTEGER, winner_team_id TEXT, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS teams (event_id TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, eliminated INTEGER NOT NULL DEFAULT 0, pool INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(event_id,id));
CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY AUTOINCREMENT, torn_id INTEGER UNIQUE NOT NULL, torn_name TEXT NOT NULL, created_at INTEGER NOT NULL, last_login_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, player_id INTEGER NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY(player_id) REFERENCES players(id));
CREATE TABLE IF NOT EXISTS bets (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, event_id TEXT NOT NULL, player_name TEXT NOT NULL, player_id INTEGER NOT NULL, team_id TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT', created_at INTEGER NOT NULL, paid_at INTEGER, payment_ref TEXT UNIQUE, settled_at INTEGER, payout INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_event_team ON bets(event_id,team_id);
CREATE INDEX IF NOT EXISTS idx_bets_player ON bets(player_id,event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS admin_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, bet_code TEXT, details TEXT, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_bets_event_status ON bets(event_id,status);
