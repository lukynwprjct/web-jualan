# 🛠️ Fix RLS Policy Instructions

## Problem
RLS policy memblokir DELETE/UPDATE/INSERT karena auth session belum ter-set dengan benar untuk user `lukfanddyyy@gmail.com`.

## Solution
Migration `0003_enable_rls.sql` sudah diupdate untuk allow `lukfanddyyy@gmail.com` semua operations.

## Action Required

### 1. Run Migration via Supabase Dashboard

1. Buka https://supabase.com/dashboard
2. Pilih project: `retpbhcztvthymtluesu`
3. Klik **SQL Editor** di sidebar kiri
4. Copy isi file: `supabase/migrations/0003_enable_rls.sql`
5. Paste ke SQL Editor
6. Klik **Run**

### 2. Alternative: Drop & Recreate Policies

Jika migration tidak work, drop semua policy dan buat ulang:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "SUPERADMIN can delete admin users" ON admin_users;
DROP POLICY IF EXISTS "ADMIN+ can delete categories" ON categories;
DROP POLICY IF EXISTS "ADMIN+ can delete products" ON products;
DROP POLICY IF EXISTS "ADMIN+ can delete customers" ON customers;
DROP POLICY IF EXISTS "ADMIN+ can delete inquiries" ON inquiries;
DROP POLICY IF EXISTS "ADMIN+ can delete bot events" ON bot_events;

-- Recreate with lukfanddyyy@gmail.com access
-- (Copy policy dari 0003_enable_rls.sql yang sudah updated)
```

### 3. Verify RLS Policy

```sql
SELECT polname, tablename 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, polname;
```

Expected: Policies dengan `lukfanddyyy@gmail.com` should exist.

### 4. Test Delete Product

Setelah migration berhasil:

1. Login ke admin dashboard: http://192.168.0.100:3001/admin/login
2. Email: `lukfanddyyy@gmail.com`
3. Password: (valid password >= 6 char)
4. Navigate to Products page: http://192.168.0.100:3001/admin/products
5. Create test product (dulu harus ada category)
6. Test delete product

## Dev Server Log

Check browser console untuk:
```
✅ Auth session synced for RLS
✅ User role set to: STAFF
```

## Files Updated

- `supabase/migrations/0003_enable_rls.sql` - Updated RLS policy untuk allow `lukfanddyyy@gmail.com`
- `src/lib/supabase.ts` - Auto-set auth session dari localStorage
- `src/lib/auth.ts` - Sync auth session ke Supabase setelah login

## Next Steps

1. Run migration
2. Test delete product
3. Test inquiry flow
