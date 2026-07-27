-- ============================================================
-- Migration: Expand Available Stocks
-- Description: Adds rich metadata and live pricing toggles 
--              to the available_stocks table.
-- ============================================================

-- 1. Add new columns for rich metadata
ALTER TABLE public.available_stocks
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS change_24h NUMERIC(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS change_percent_24h NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS market_cap TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pe_ratio TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS dividend_yield TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS high_52w NUMERIC(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS low_52w NUMERIC(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS volume TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS analyst_rating TEXT DEFAULT 'Hold',
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS chart_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS use_live_price BOOLEAN DEFAULT false;

-- 2. Update existing seed data to match the rich UI
UPDATE public.available_stocks SET
  category = 'tech',
  market_cap = '$3.42 Trillion',
  pe_ratio = '33.8',
  dividend_yield = '0.44%',
  high_52w = 237.23,
  low_52w = 164.08,
  volume = '48.2M',
  analyst_rating = 'Strong Buy',
  description = 'Global technology leader in consumer electronics, software, and services including iPhone, Mac, and iCloud ecosystems.',
  chart_data = '[{"day": "Mon", "price": 218.1}, {"day": "Tue", "price": 220.4}, {"day": "Wed", "price": 219.8}, {"day": "Thu", "price": 222.1}, {"day": "Fri", "price": 221.9}, {"day": "Sat", "price": 223.4}, {"day": "Sun", "price": 224.5}]'::jsonb,
  change_24h = 3.20,
  change_percent_24h = 1.45,
  use_live_price = true
WHERE symbol = 'AAPL';

UPDATE public.available_stocks SET
  category = 'tech',
  market_cap = '$3.33 Trillion',
  pe_ratio = '36.2',
  dividend_yield = '0.67%',
  high_52w = 468.35,
  low_52w = 309.45,
  volume = '22.1M',
  analyst_rating = 'Strong Buy',
  description = 'Enterprise software giant specializing in Azure cloud platform, Windows OS, Productivity Software, and OpenAI partnership.',
  chart_data = '[{"day": "Mon", "price": 442.1}, {"day": "Tue", "price": 444.5}, {"day": "Wed", "price": 443.2}, {"day": "Thu", "price": 447.8}, {"day": "Fri", "price": 446.1}, {"day": "Sat", "price": 448.2}, {"day": "Sun", "price": 448.9}]'::jsonb,
  change_24h = 2.75,
  change_percent_24h = 0.62,
  use_live_price = true
WHERE symbol = 'MSFT';

UPDATE public.available_stocks SET
  category = 'tech',
  market_cap = '$2.18 Trillion',
  pe_ratio = '26.5',
  dividend_yield = '0.45%',
  high_52w = 193.31,
  low_52w = 120.21,
  volume = '28.4M',
  analyst_rating = 'Buy',
  description = 'Multinational technology company focusing on search engine technology, online advertising, cloud computing, and AI.',
  chart_data = '[{"day": "Mon", "price": 172.1}, {"day": "Tue", "price": 171.5}, {"day": "Wed", "price": 173.2}, {"day": "Thu", "price": 174.8}, {"day": "Fri", "price": 174.1}, {"day": "Sat", "price": 175.2}, {"day": "Sun", "price": 175.8}]'::jsonb,
  change_24h = 1.70,
  change_percent_24h = 0.98,
  use_live_price = true
WHERE symbol = 'GOOGL';

UPDATE public.available_stocks SET
  category = 'tech',
  market_cap = '$1.91 Trillion',
  pe_ratio = '52.1',
  dividend_yield = '0.00%',
  high_52w = 191.70,
  low_52w = 118.35,
  volume = '35.6M',
  analyst_rating = 'Buy',
  description = 'E-commerce and cloud computing behemoth providing AWS, Prime retail network, and digital streaming.',
  chart_data = '[{"day": "Mon", "price": 178.1}, {"day": "Tue", "price": 179.5}, {"day": "Wed", "price": 178.2}, {"day": "Thu", "price": 180.8}, {"day": "Fri", "price": 181.1}, {"day": "Sat", "price": 182.2}, {"day": "Sun", "price": 182.1}]'::jsonb,
  change_24h = 1.00,
  change_percent_24h = 0.55,
  use_live_price = true
WHERE symbol = 'AMZN';

UPDATE public.available_stocks SET
  category = 'index',
  market_cap = '$520.5 Billion',
  pe_ratio = 'N/A',
  dividend_yield = '1.35%',
  high_52w = 518.22,
  low_52w = 410.15,
  volume = '75.2M',
  analyst_rating = 'Buy',
  description = 'Exchange-traded fund that tracks the S&P 500 index, representing 500 of the largest U.S. publicly traded companies.',
  chart_data = '[{"day": "Mon", "price": 505.1}, {"day": "Tue", "price": 506.5}, {"day": "Wed", "price": 504.2}, {"day": "Thu", "price": 508.8}, {"day": "Fri", "price": 509.1}, {"day": "Sat", "price": 510.2}, {"day": "Sun", "price": 510.3}]'::jsonb,
  change_24h = -1.20,
  change_percent_24h = -0.23,
  use_live_price = true
WHERE symbol = 'SPY';

-- 3. Insert new seed data from EXTENDED_STOCKS not previously in DB
INSERT INTO public.available_stocks (
  symbol, name, category, asset_class, current_price, change_24h, change_percent_24h, 
  market_cap, pe_ratio, dividend_yield, high_52w, low_52w, volume, analyst_rating, description, chart_data, use_live_price
) VALUES 
('NVDA', 'NVIDIA Corporation', 'tech', 'stock', 128.80, 4.15, 3.33, '$3.16 Trillion', '68.4', '0.03%', 140.76, 39.23, '82.4M', 'Strong Buy', 'Pioneer in GPU design, accelerated computing architectures, data center chips, and artificial intelligence hardware.', '[{"day": "Mon", "price": 121.5}, {"day": "Tue", "price": 123.8}, {"day": "Wed", "price": 122.9}, {"day": "Thu", "price": 125.6}, {"day": "Fri", "price": 127.1}, {"day": "Sat", "price": 126.8}, {"day": "Sun", "price": 128.8}]'::jsonb, true),
('TSLA', 'Tesla, Inc.', 'growth', 'stock', 178.50, -2.45, -1.35, '$570.2 Billion', '42.1', '0.00%', 299.29, 138.80, '95.1M', 'Hold', 'Leading electric vehicle manufacturer and clean energy company specializing in battery energy storage and solar products.', '[{"day": "Mon", "price": 182.1}, {"day": "Tue", "price": 180.5}, {"day": "Wed", "price": 181.2}, {"day": "Thu", "price": 178.8}, {"day": "Fri", "price": 179.1}, {"day": "Sat", "price": 177.2}, {"day": "Sun", "price": 178.5}]'::jsonb, true),
('JPM', 'JPMorgan Chase & Co.', 'finance', 'stock', 195.20, 1.25, 0.64, '$560.1 Billion', '11.5', '2.35%', 200.30, 135.10, '12.4M', 'Buy', 'Global financial services firm and the largest bank in the United States by total assets.', '[{"day": "Mon", "price": 192.1}, {"day": "Tue", "price": 191.5}, {"day": "Wed", "price": 193.2}, {"day": "Thu", "price": 194.8}, {"day": "Fri", "price": 194.1}, {"day": "Sat", "price": 195.2}, {"day": "Sun", "price": 195.2}]'::jsonb, true)
ON CONFLICT (symbol) DO UPDATE SET 
  category = EXCLUDED.category,
  change_24h = EXCLUDED.change_24h,
  change_percent_24h = EXCLUDED.change_percent_24h,
  market_cap = EXCLUDED.market_cap,
  description = EXCLUDED.description,
  chart_data = EXCLUDED.chart_data,
  use_live_price = EXCLUDED.use_live_price;
