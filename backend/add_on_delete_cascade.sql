-- Add ON DELETE CASCADE to all user-related foreign keys
-- Run this file in your PostgreSQL database (psql, DBeaver, etc.)

-- Prices table
ALTER TABLE prices DROP CONSTRAINT IF EXISTS prices_vendor_id_fkey;
ALTER TABLE prices ADD CONSTRAINT prices_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- Price history table
ALTER TABLE price_history DROP CONSTRAINT IF EXISTS price_history_changed_by_fkey;
ALTER TABLE price_history ADD CONSTRAINT price_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE;

-- Favorites table
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE favorites ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Price alerts table
ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_user_id_fkey;
ALTER TABLE price_alerts ADD CONSTRAINT price_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Notifications table
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Sessions table
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
