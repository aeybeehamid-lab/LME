-- Add proof-of-delivery URL column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pod_url TEXT;