# Admin Setup Guide

This guide explains how to set up and manage admin users in the PACT marketplace.

## Table of Contents

- [Creating the First Admin](#creating-the-first-admin)
- [Admin Capabilities](#admin-capabilities)
- [Audit Logging](#audit-logging)
- [Security Considerations](#security-considerations)

---

## Creating the First Admin

For security reasons, admin accounts cannot be created through the public signup form. Instead, you must promote an existing user to admin role via the database.

### Step 1: Create a Regular Account

1. Go to the PACT signup page (`/signup`)
2. Create an account with a secure email and password
3. You can choose either "buyer" or "farmer" role initially

### Step 2: Find the User's UUID

Option A - Via Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Find the user and copy their UUID

Option B - Via SQL Query:
```sql
SELECT id, email, role FROM public.profiles WHERE email = 'your-email@example.com';
```

### Step 3: Promote to Admin

1. Open the Supabase SQL Editor
2. Open the seed script: `supabase/seed-admin.sql`
3. Replace `YOUR_USER_UUID_HERE` with the actual UUID
4. Run the script

**Example:**
```sql
DO $$
DECLARE
    target_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
BEGIN
    UPDATE public.profiles
    SET 
        role = 'admin',
        is_verified = true,
        updated_at = now()
    WHERE id = target_user_id;
    
    RAISE NOTICE 'User promoted to admin.';
END $$;
```

### Step 4: Verify

```sql
SELECT id, email, role, is_verified FROM public.profiles WHERE role = 'admin';
```

### Step 5: Access Admin Dashboard

1. Log in with the promoted account
2. You will be redirected to `/admin`

---

## Admin Capabilities

Admins have access to the following actions:

### User Management
| Action | Description |
|--------|-------------|
| Update User Role | Change a user's role (buyer/farmer/admin) |
| Suspend User | Temporarily disable a user account |
| Unsuspend User | Reactivate a suspended account |
| Toggle Verification | Verify/unverify farmer accounts |

### Listing Management
| Action | Description |
|--------|-------------|
| Approve Listing | Approve a pending listing for the marketplace |
| Reject Listing | Reject a listing submission |
| Delete Listing | Remove a listing from the platform |

### Pool Management
| Action | Description |
|--------|-------------|
| Cancel Pool | Cancel an active pool |
| Release Funds | Mark funded pools as completed |

### Dispute Management
| Action | Description |
|--------|-------------|
| Resolve Dispute | Close a dispute with resolution |
| Update Status | Change dispute status |
| Add Notes | Add admin notes to a dispute |

### Payout Management
| Action | Description |
|--------|-------------|
| Update Status | Change payout status |
| Process All Pending | Batch process pending payouts |

### Contact Submissions
| Action | Description |
|--------|-------------|
| Update Status | Update submission status |
| Delete | Remove a contact submission |

---

## Audit Logging

All admin actions are automatically logged to the `admin_audit_log` table for accountability and debugging.

### What's Logged

Each log entry includes:
- **admin_id**: Who performed the action
- **action**: Type of action (e.g., `update_user_role`, `suspend_user`)
- **target_type**: Resource type (e.g., `profile`, `listing`)
- **target_id**: ID of the affected resource
- **old_value**: Previous state (JSON)
- **new_value**: New state (JSON)
- **metadata**: Additional context
- **ip_address**: Request IP address
- **user_agent**: Browser/client info
- **created_at**: Timestamp

### Viewing Audit Logs

```sql
-- View recent admin actions
SELECT 
    al.created_at,
    p.email as admin_email,
    al.action,
    al.target_type,
    al.target_id,
    al.old_value,
    al.new_value
FROM admin_audit_log al
JOIN profiles p ON p.id = al.admin_id
ORDER BY al.created_at DESC
LIMIT 50;

-- View actions by a specific admin
SELECT * FROM admin_audit_log 
WHERE admin_id = 'admin-uuid-here'
ORDER BY created_at DESC;

-- View actions on a specific user
SELECT * FROM admin_audit_log 
WHERE target_type = 'profile' 
AND target_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

---

## Security Considerations

### Role Protection
- Admins cannot modify their own role
- Admins cannot suspend their own account
- The signup form only allows `buyer` or `farmer` roles

### Input Validation
All admin actions use Zod schemas for input validation:
- UUID format validation
- String length limits
- Enum validation for statuses

### Row Level Security
Admin RLS policies ensure:
- Only admins can view audit logs
- Audit logs cannot be modified or deleted
- Admins have elevated access to user data

### Best Practices

1. **Limit Admin Count**: Only promote trusted team members
2. **Use Strong Passwords**: Require complex passwords for admin accounts
3. **Monitor Audit Logs**: Regularly review admin actions
4. **Rotate Credentials**: Periodically update admin passwords
5. **Remove Inactive Admins**: Demote admin accounts no longer needed

### Demoting an Admin

To remove admin privileges:

```sql
UPDATE public.profiles
SET 
    role = 'buyer',  -- or 'farmer'
    updated_at = now()
WHERE id = 'admin-uuid-to-demote';
```

---

## Troubleshooting

### "Unauthorized: Admin access required"
- Verify the user's role is set to `admin` in the profiles table
- Clear browser cache and re-login

### Admin actions failing silently
- Check the browser console for errors
- Verify RLS policies are applied correctly
- Check Supabase logs for database errors

### Audit logs not appearing
- Verify the `admin_audit_log` table exists
- Check RLS policies allow the admin to insert logs
- Audit logging failures are silent to not break admin actions

---

## Related Files

| File | Description |
|------|-------------|
| `src/app/admin/actions.ts` | Server actions for admin operations |
| `src/lib/auth/admin-utils.ts` | Admin verification utilities |
| `src/lib/auth/audit-log.ts` | Audit logging helper |
| `src/lib/validations/admin.ts` | Zod schemas for validation |
| `supabase/seed-admin.sql` | Admin promotion script |
| `supabase/migrations/20260127_admin_audit_log.sql` | Audit log table migration |
