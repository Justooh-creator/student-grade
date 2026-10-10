INSERT INTO public.gift_codes (code, kind, days) VALUES
  ('EDUREPORT-DEV-2026', 'developer', 36500),
  ('GIFT-TERM-K7M2', 'gift', 100),
  ('GIFT-TERM-Q4X9', 'gift', 100),
  ('GIFT-YEAR-B3N8', 'gift', 400)
ON CONFLICT (code) DO NOTHING;