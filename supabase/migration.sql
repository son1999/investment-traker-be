-- Users managed by Supabase Auth (auth.users)
-- No custom users table needed

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('metal', 'crypto', 'stock')),
  asset_code TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('MUA', 'BAN')),
  quantity DECIMAL(18,8) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(18,2) NOT NULL CHECK (unit_price > 0),
  note TEXT,
  icon TEXT NOT NULL DEFAULT '💰',
  icon_bg TEXT NOT NULL DEFAULT '#3b3b3e',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '💰',
  type TEXT NOT NULL CHECK (type IN ('metal', 'crypto', 'stock')),
  price DECIMAL(18,2) NOT NULL CHECK (price >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, code)
);

CREATE TABLE allocation_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('metal', 'crypto', 'stock')),
  target_percent DECIMAL(5,2) NOT NULL CHECK (target_percent >= 0 AND target_percent <= 100),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asset_type)
);

-- Indexes
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(user_id, date DESC);
CREATE INDEX idx_prices_user ON prices(user_id);
CREATE INDEX idx_allocation_user ON allocation_targets(user_id);

-- Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own prices"
  ON prices FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own allocation targets"
  ON allocation_targets FOR ALL USING (auth.uid() = user_id);
