# 🧪 Testing Guide - Admin Dashboard & Inquiry Flow

## Setup Steps

### 1. Fix RLS Policy (REQUIRED)

**Reason:** RLS policy memblokir DELETE/UPDATE/INSERT karena auth session belum ter-set

**Solution:** Update migration `0003_enable_rls.sql` untuk allow `lukfanddyyy@gmail.com`

**Action:**
1. Buka https://supabase.com/dashboard/project/retpbhcztvthymtluesu
2. Klik **SQL Editor**
3. Copy isi file: `supabase/migrations/0003_enable_rls.sql`
4. Paste & Run

**Verify:**
```sql
SELECT polname, tablename 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, polname;
```

### 2. Verify Dev Server Running

Server running di: http://192.168.0.100:3001

Test:
```bash
curl -s http://192.168.0.100:3001/ | grep -o "Luxky"
# Expected: Luxky (product list title)
```

---

## Test Cases

### ✅ Test 1: Admin Login & Auth Session

**URL:** http://192.168.0.100:3001/admin/login

**Steps:**
1. Email: `lukfanddyyy@gmail.com`
2. Password: (>= 6 characters)
3. Click Login
4. Check browser console for:
   - `✅ Auth session synced for RLS`
   - `✅ User role set to: STAFF`

**Expected Result:** Redirect to `/admin/dashboard`

---

### ✅ Test 2: Admin Dashboard

**URL:** http://192.168.0.100:3001/admin/dashboard

**Check:**
- [ ] Quick stats cards show data
- [ ] Recent inquiries list
- [ ] Navigation menu works
- [ ] Logout button works

---

### ✅ Test 3: Admin Products CRUD

**URL:** http://192.168.0.100:3001/admin/products

#### 3a. Create Product
**Steps:**
1. Click "+ Add Product"
2. Fill form:
   - Name: "Test Product"
   - Description: "Testing product"
   - Price: 999000
   - Category: (select existing or create new)
   - Image URL: (ImgBB direct URL)
   - Stock: 10
3. Click "Save Product"

**Expected:** Product created, list refreshes

#### 3b. Update Product
**Steps:**
1. Click edit icon on product
2. Modify stock to 5
3. Click "Update Product"

**Expected:** Product updated, status auto-change (stock=0 → SOLD)

#### 3c. Delete Product (THE KEY TEST)
**Steps:**
1. Click delete icon on product
2. Confirm deletion

**Expected:** Product deleted, no error in console

**If error:**
- Check browser console for RLS error
- Verify migration 0003 executed
- Check RLS policy: `lukfanddyyy@gmail.com can manage products`

---

### ✅ Test 4: Admin Categories CRUD

**URL:** http://192.168.0.100:3001/admin/categories

**Test:**
- [ ] Create category
- [ ] Update category
- [ ] Delete category (should fail if products use this category)

---

### ✅ Test 5: Admin Customers CRUD

**URL:** http://192.168.0.100:3001/admin/customers

**Test:**
- [ ] View customers list
- [ ] Delete customer
- [ ] Toggle WhatsApp active status

---

### ✅ Test 6: Admin Inquiries CRUD

**URL:** http://192.168.0.100:3001/admin/inquiries

**Test:**
- [ ] View inquiries list
- [ ] Update status (PENDING → CONTACTED → COMPLETED)
- [ ] Add admin remarks
- [ ] Delete inquiry

---

### ✅ Test 7: Admin Brand Settings

**URL:** http://192.168.0.100:3001/admin/brand-settings

**Test:**
- [ ] View current brand settings
- [ ] Update brand name
- [ ] Update contact info

---

### ✅ Test 8: Customer Inquiry Flow (End-to-End)

**URL:** http://192.168.0.100:3001/inquiry/{product_id}

**Steps:**
1. Navigate to any product detail page
2. Click "Inquiry" button
3. Fill form:
   - Full Name: "John Doe"
   - WhatsApp: "081234567890"
   - Message: "I'm interested"
4. Submit

**Expected:**
- Success alert: "Inquiry berhasil dikirim!"
- Customer created in database (whatsapp_normalized: 6281234567890)
- Inquiry created in database
- Bot event queued
- Product stock decremented

**Check Database:**
```sql
-- Verify customer created
SELECT * FROM customers WHERE whatsapp_normalized = '6281234567890';

-- Verify inquiry created
SELECT * FROM inquiries WHERE customer_whatsapp = '6281234567890';

-- Verify bot event queued
SELECT * FROM bot_events WHERE event_type = 'INQUIRY_CREATED';
```

---

## Troubleshooting

### Issue: "new row violates row-level security policy"

**Cause:** RLS policy memblokir operation

**Solution:**
1. Verify migration 0003 executed
2. Check policy exists:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'products' 
   AND polname LIKE '%lukfanddyyy@gmail.com%';
   ```
3. If not exists, run migration again

### Issue: "Auth session synced" not showing in console

**Cause:** Auth not properly initialized

**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Logout (click logout button)
3. Login again with `lukfanddyyy@gmail.com`

### Issue: Delete button not working

**Cause:** RLS policy blocking or React state issue

**Debug:**
1. Check browser console for error
2. Verify user role in auth store
3. Check network tab for DELETE request response

---

## Development Notes

### Files Modified

1. **supabase/migrations/0003_enable_rls.sql**
   - Updated RLS policy untuk allow `lukfanddyyy@gmail.com` semua operations

2. **src/lib/supabase.ts**
   - Auto-set auth session dari localStorage on load

3. **src/lib/auth.ts**
   - Sync auth session ke Supabase setelah login

4. **src/pages/InquiryForm.tsx**
   - Fixed component mount (useEffect instead of useState)
   - Fixed column names untuk customers dan inquiries
   - Removed unused import

### Database Table Structure

**Products:**
- id (UUID)
- name (TEXT)
- description (TEXT)
- price (BIGINT)
- category_id (UUID)
- image_url (TEXT)
- status (READY/RESERVED/SOLD)
- stock (INTEGER)
- created_at, updated_at

**Categories:**
- id (UUID)
- name (TEXT)
- description (TEXT)
- image_url (TEXT)
- is_active (BOOLEAN)

**Customers:**
- id (UUID)
- whatsapp_normalized (TEXT UNIQUE)
- whatsapp_display (TEXT)
- full_name (TEXT)
- address (TEXT)
- created_at, updated_at

**Inquiries:**
- id (UUID)
- product_id (UUID)
- product_name (TEXT)
- product_price (BIGINT)
- customer_id (UUID)
- customer_name (TEXT)
- customer_whatsapp (TEXT)
- note (TEXT)
- status (PENDING/CONTACTED/COMPLETED/CANCELLED)
- created_at, updated_at

---

## Success Criteria

✅ RLS policy updated  
✅ Admin can login  
✅ Admin can CRUD products (including DELETE)  
✅ Admin can CRUD categories  
✅ Admin can CRUD customers  
✅ Admin can CRUD inquiries  
✅ Customer inquiry flow works  
✅ Bot event queued on inquiry  
✅ Product stock auto-update  

---

## Next Steps After Testing

1. Setup WhatsApp Bot integration (AI LUCK)
2. Configure webhook untuk notifikasi
3. Setup ImgBB upload API untuk product images
4. Add pagination untuk large dataset
5. Add search & filter functionality
