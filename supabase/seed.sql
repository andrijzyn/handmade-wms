-- ============================================================
-- StockPulse — Seed Data
-- Виконай ПІСЛЯ schema.sql у Supabase Dashboard → SQL Editor
-- ============================================================

-- Default admin account — change the password immediately after first login
insert into users (username, password, full_name, rank, unit, callsign, clearance_level, role, is_active)
values (
  'admin',
  '$2b$10$gQdiOaF8mJzuwsLH7Gh/.ebFHk8Id9RThPRFgtFehWH0zqzO3mw9y',
  'Адміністратор системи',
  'Полковник',
  'Штаб',
  'КОРОНА',
  'Особливої важливості',
  'admin',
  true
)
on conflict (username) do nothing;

-- Приклади продуктів
insert into products (name, sku, category, quantity, price, low_stock_threshold, description)
values
  ('Wireless Mouse', 'WM-001', 'Electronics', 45, 29.99, 10, 'Ergonomic wireless mouse with USB receiver'),
  ('Mechanical Keyboard', 'MK-002', 'Electronics', 8, 89.99, 10, 'Cherry MX Blue switches, full-size'),
  ('USB-C Cable 2m', 'UC-003', 'Accessories', 150, 12.99, 20, 'Braided USB-C to USB-C cable'),
  ('Monitor Stand', 'MS-004', 'Furniture', 3, 49.99, 5, 'Adjustable aluminum monitor stand'),
  ('Laptop Sleeve 15"', 'LS-005', 'Accessories', 0, 24.99, 10, 'Neoprene laptop sleeve for 15-inch laptops'),
  ('Webcam HD 1080p', 'WC-006', 'Electronics', 22, 59.99, 10, 'Full HD webcam with built-in microphone'),
  ('Desk Lamp LED', 'DL-007', 'Furniture', 5, 34.99, 8, 'Dimmable LED desk lamp with USB charging port'),
  ('HDMI Cable 3m', 'HC-008', 'Accessories', 80, 9.99, 15, 'High-speed HDMI 2.1 cable'),
  ('Headphone Stand', 'HS-009', 'Furniture', 12, 19.99, 5, 'Aluminum headphone stand'),
  ('Wireless Charger', 'WCH-010', 'Electronics', 0, 39.99, 10, '15W fast wireless charger pad')
on conflict (sku) do nothing;

/*Init tables - prodloc, loc*/
CREATE TABLE locations (
                           id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                           row    INTEGER NOT NULL CHECK (row BETWEEN 1 AND 100),
                           col    INTEGER NOT NULL CHECK (col BETWEEN 1 AND 100),
                           level  INTEGER NOT NULL CHECK (level IN (0,10,20,30,40,50,60)),
                           label  TEXT GENERATED ALWAYS AS (
                               '' || LPAD(row::text,3,'0') ||
                               '-' || LPAD(col::text,3,'0') ||
                               '-' || level::text
) STORED,
  UNIQUE(row, col, level)
);

CREATE TABLE product_locations (
                                   id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                   product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                                   location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
                                   quantity   INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
                                   updated_at TIMESTAMPTZ DEFAULT now(),
                                   UNIQUE(product_id, location_id)
);

/* Generate matrix */
INSERT INTO locations (row, col, level)
SELECT
    r.row,
    c.col,
    l.level
FROM
    generate_series(1, 10) AS r(row),
    generate_series(1, 10) AS c(col),
    unnest(ARRAY[0,1,2,3,4,5,6]) AS l(level)
    ON CONFLICT (row, col, level) DO NOTHING;

/* fix for connection between id's*/
ALTER TABLE product_locations
    ADD CONSTRAINT product_locations_location_id_fkey
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE;
