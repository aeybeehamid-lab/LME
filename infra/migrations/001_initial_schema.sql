-- LME initial schema (V1)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('customer', 'rider', 'executive', 'ops_assistant');
CREATE TYPE order_status AS ENUM (
  'created',
  'payment_pending',
  'payment_confirmed',
  'posted_to_job_board',
  'rider_assigned',
  'picked_up',
  'en_route',
  'delivered',
  'escalated',
  'cancelled',
  'refunded'
);
CREATE TYPE order_category AS ENUM ('gadgets', 'food', 'grocery', 'laundry', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  name VARCHAR(120),
  firebase_uid VARCHAR(128),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bike_id VARCHAR(50),
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  strike_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  rider_id UUID REFERENCES users(id),
  category order_category NOT NULL,
  status order_status NOT NULL DEFAULT 'created',
  delivery_fee_kobo BIGINT NOT NULL CHECK (delivery_fee_kobo >= 0),
  urgent_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  item_description TEXT,
  escalated_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  actor_user_id UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  paystack_reference VARCHAR(120) NOT NULL UNIQUE,
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
  status payment_status NOT NULL DEFAULT 'pending',
  idempotency_key VARCHAR(120) NOT NULL UNIQUE,
  webhook_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_rider ON orders(rider_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_reference ON payments(paystack_reference);
