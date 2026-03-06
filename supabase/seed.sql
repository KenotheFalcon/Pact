-- Seed data for Pact Marketplace testing
-- This script creates sample data for development and testing

-- Note: Run this after the main migration

-- Sample farmer profiles (using mock UUIDs - replace with actual auth user IDs)
-- Location: Lagos, Nigeria area

-- Insert sample listings
INSERT INTO public.listings (
  id,
  farmer_id,
  name,
  description,
  category,
  price_per_unit,
  unit,
  quantity,
  min_pool_qty,
  images,
  latitude,
  longitude,
  address,
  city,
  country,
  harvest_date,
  organic,
  status
) VALUES
-- Vegetables
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM profiles WHERE role = 'farmer' LIMIT 1), 'Fresh Organic Tomatoes', 'Locally grown, vine-ripened tomatoes. Perfect for sauces and salads.', 'vegetables', 3.50, 'kg', 500, 20, '["https://picsum.photos/seed/tomatoes1/600/400", "https://picsum.photos/seed/tomatoes2/600/400"]', 6.5244, 3.3792, '123 Farm Road, Ikeja', 'Lagos', 'Nigeria', CURRENT_DATE + INTERVAL '2 days', true, 'available'),

('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM profiles WHERE role = 'farmer' LIMIT 1 OFFSET 1), 'Fresh Spinach Bunches', 'Crispy, green spinach. Rich in iron and vitamins.', 'vegetables', 2.00, 'bunch', 300, 15, '["https://picsum.photos/seed/spinach1/600/400"]', 6.4541, 3.3947, '45 Green Valley Farm, Lekki', 'Lagos', 'Nigeria', CURRENT_DATE + INTERVAL '1 day', true, 'available'),

('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM profiles WHERE role = 'farmer' LIMIT 1), 'Sweet Bell Peppers', 'Colorful mix of red, yellow, and green bell peppers.', 'vegetables', 4.00, 'kg', 200, 10, '["https://picsum.photos/seed/peppers1/600/400"]', 6.5951, 3.3413, '89 Pepper Lane, Yaba', 'Lagos', 'Nigeria', CURRENT_DATE, false, 'available'),

-- Fruits
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM profiles WHERE role = 'farmer' LIMIT 1 OFFSET 1), 'Ripe Mangoes', 'Sweet and juicy mangoes. Perfect for eating fresh or making smoothies.', 'fruits', 1.50, 'pc', 1000, 50, '["https://picsum.photos/seed/mango1/600/400", "https://picsum.photos/seed/mango2/600/400"]', 6.4698, 3.5852, '12 Mango Grove, Ajah', 'Lagos', 'Nigeria', CURRENT_DATE, false, 'available'),

('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM profiles WHERE role = 'farmer' LIMIT 1), 'Fresh Pineapples', 'Golden pineapples, sweet and tangy. Great for juices and desserts.', 'fruits', 2.50, 'pc', 400, 20, '["https://picsum.photos/seed/pineapple1/600/400"]', 6.6018, 3.3515, '67 Tropical Farm Road, Surulere', 'Lagos', 'Nigeria', CURRENT_DATE + INTERVAL '3 days', false, 'available'),

('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM profiles WHERE role = 'farmer' LIMIT 1 OFFSET 1), 'Watermelons', 'Large, seedless watermelons. Juicy and refreshing.', 'fruits', 5.00, 'pc', 150, 10, '["https://picsum.photos/seed/watermelon1/600/400"]', 6.5355, 3.3947, '34 Watermelon Farm, Victoria Island', 'Lagos', 'Nigeria', CURRENT_DATE + INTERVAL '1 day', false, 'available'),

-- Grains
('550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM profiles WHERE role = 'farmer' LIMIT 1), 'Golden Corn', 'Fresh sweet corn, perfect for grilling or boiling.', 'grains', 1.20, 'ear', 800, 30, '["https://picsum.photos/seed/corn1/600/400"]', 6.4281, 3.4219, '90 Corn Fields, Festac', 'Lagos', 'Nigeria', CURRENT_DATE, false, 'available'),

('550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM profiles WHERE role = 'farmer' LIMIT 1 OFFSET 1), 'Brown Rice', 'Organic brown rice. Healthy and nutritious.', 'grains', 8.00, 'kg', 500, 25, '["https://picsum.photos/seed/rice1/600/400"]', 6.4968, 3.3792, '23 Rice Paddies, Badagry', 'Lagos', 'Nigeria', CURRENT_DATE - INTERVAL '1 day', true, 'available'),

-- Root vegetables
('550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM profiles WHERE role = 'farmer' LIMIT 1), 'Sweet Potatoes', 'Fresh sweet potatoes. Great for baking or mashing.', 'vegetables', 2.80, 'kg', 600, 20, '["https://picsum.photos/seed/sweetpotato1/600/400"]', 6.5480, 3.3760, '56 Root Road, Ikorodu', 'Lagos', 'Nigeria', CURRENT_DATE + INTERVAL '5 days', false, 'available'),

('550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM profiles WHERE role = 'farmer' LIMIT 1 OFFSET 1), 'Fresh Carrots', 'Crunchy orange carrots, rich in beta-carotene.', 'vegetables', 3.00, 'kg', 400, 15, '["https://picsum.photos/seed/carrot1/600/400"]', 6.4433, 3.4511, '78 Carrot Lane, Epe', 'Lagos', 'Nigeria', CURRENT_DATE + INTERVAL '2 days', true, 'available');

-- Insert sample pools
INSERT INTO public.pools (
  id,
  listing_id,
  leader_id,
  min_quantity,
  current_quantity,
  expires_at,
  status
) VALUES
-- Active pool for tomatoes
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM profiles WHERE role = 'buyer' LIMIT 1), 100, 65, CURRENT_TIMESTAMP + INTERVAL '5 days', 'active'),

-- Active pool for mangoes
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM profiles WHERE role = 'buyer' LIMIT 1 OFFSET 1), 200, 120, CURRENT_TIMESTAMP + INTERVAL '7 days', 'active'),

-- Active pool for corn
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM profiles WHERE role = 'buyer' LIMIT 1), 150, 90, CURRENT_TIMESTAMP + INTERVAL '4 days', 'active'),

-- Nearly funded pool for peppers
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM profiles WHERE role = 'buyer' LIMIT 1 OFFSET 1), 50, 45, CURRENT_TIMESTAMP + INTERVAL '3 days', 'active'),

-- Funded pool for spinach
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM profiles WHERE role = 'buyer' LIMIT 1), 100, 100, CURRENT_TIMESTAMP + INTERVAL '6 days', 'funded');

-- Note: To fully populate the database with realistic data:
-- 1. Create actual farmer and buyer accounts through the app
-- 2. Update the farmer_id and organizer_id references above
-- 3. Add sample orders and reviews after payments are processed
-- 4. Populate participants JSONB arrays with actual user data after joining pools

COMMENT ON TABLE public.listings IS 'Sample listings for development - replace farmer_id with actual user IDs';
COMMENT ON TABLE public.pools IS 'Sample pools for development - replace leader_id with actual user IDs';
