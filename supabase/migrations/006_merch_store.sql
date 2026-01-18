-- Add merch store and enhanced token rewards

-- Create merch_orders table for token redemption
CREATE TABLE IF NOT EXISTS merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  cost INTEGER NOT NULL,
  shipping_info JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  tracking_number TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_merch_orders_user_id ON merch_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON merch_orders(status);

-- Enable RLS
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for merch_orders
CREATE POLICY "Users can view their own merch orders"
  ON merch_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own merch orders"
  ON merch_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add invited_by field to users for referral tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Generate invite codes for existing users
UPDATE users SET invite_code = substring(encode(gen_random_bytes(6), 'base64'), 1, 8) WHERE invite_code IS NULL;

-- Add index for invite code lookups
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);

COMMENT ON TABLE merch_orders IS 'Store merch redemptions with token costs';
COMMENT ON COLUMN users.invited_by IS 'User who invited this user (for referral bonuses)';
COMMENT ON COLUMN users.invite_code IS 'Unique invite code for referral tracking';
