@@ .. @@
 INSERT INTO members (
   phone,
   full_name,
   is_admin,
   is_active
 ) VALUES (
-  '+1 (925) 434-3862',
+  '9254343862',
   'Administrator',
   true,
   true
 ) ON CONFLICT (phone) DO UPDATE SET
   is_admin = EXCLUDED.is_admin,
   is_active = EXCLUDED.is_active;