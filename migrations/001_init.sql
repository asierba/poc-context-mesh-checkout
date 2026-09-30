CREATE TABLE carts (
  id            TEXT PRIMARY KEY,
  customer_id   TEXT NOT NULL,
  currency      CHAR(3) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  cart_id           TEXT NOT NULL REFERENCES carts(id),
  sku               TEXT NOT NULL,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents  INTEGER NOT NULL,
  PRIMARY KEY (cart_id, sku)
);

CREATE TABLE orders (
  id                TEXT PRIMARY KEY,
  cart_id           TEXT NOT NULL REFERENCES carts(id),
  customer_id       TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  shipping_address  JSONB NOT NULL,
  total_cents       INTEGER NOT NULL,
  currency          CHAR(3) NOT NULL,
  payment_id        TEXT,
  status            TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbox (
  id            TEXT PRIMARY KEY,
  topic         TEXT NOT NULL,
  payload       JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ
);

CREATE INDEX outbox_unpublished ON outbox (created_at) WHERE published_at IS NULL;
