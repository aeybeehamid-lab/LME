-- Admin-adjustable delivery pricing (stored as JSON)

CREATE TABLE IF NOT EXISTS platform_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

INSERT INTO platform_settings (setting_key, value)
VALUES (
  'pricing',
  '{
    "gadgets": {
      "phone": { "minKobo": 80000, "maxKobo": 200000 },
      "laptop": { "minKobo": 300000, "maxKobo": 400000 },
      "other": { "minKobo": 150000, "maxKobo": 350000 }
    },
    "grocery": { "baseKobo": 120000, "percentBps": 500 },
    "food": { "baseKobo": 120000 },
    "laundry": { "baseKobo": 150000 },
    "other": { "baseKobo": 120000 },
    "urgent": { "minMultiplier": 1.5, "maxMultiplier": 2.0 }
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;
