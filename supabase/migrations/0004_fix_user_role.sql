-- ============================================
-- FIX: Set user role untuk testing
-- ============================================

-- Update user email di admin_users table (manual setup)
-- User: lukfanddyyy@gmail.com -> role SUPERADMIN

-- Insert atau update user dengan role SUPERADMIN
INSERT INTO admin_users (email, full_name, role)
VALUES ('lukfanddyyy@gmail.com', 'Lukfand Dyyy', 'SUPERADMIN')
ON CONFLICT (email) 
DO UPDATE SET role = 'SUPERADMIN', updated_at = NOW();

-- Verifikasi
SELECT * FROM admin_users WHERE email = 'lukfanddyyy@gmail.com';
