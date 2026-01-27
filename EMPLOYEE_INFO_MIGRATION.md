# Employee Information Fields Migration

## Overview
This migration adds employee information fields to the users table:
- **address**: Text field for employee address
- **birthday**: Date field for employee birthday
- **employment_type**: Enum field for employment type (full_time, part_time, internship, minijob)

## Changes Made

### 1. Database Schema
- Created migration file: `backend-service/migrations/add-employee-info.sql`
- Updated base schema: `backend-service/migrations/schema.sql`

### 2. Backend API
- Updated GET endpoints to include new fields
- Updated POST endpoint (create user) to accept new fields
- Updated PUT endpoint (update user) to accept new fields

### 3. Frontend
- Updated TypeScript types in `src/types.ts`
- Updated Users page with new form fields
- Added employment type dropdown with German labels

### 4. Employment Types
- `full_time`: Vollzeit
- `part_time`: Teilzeit
- `internship`: Praktikum
- `minijob`: Minijob

## Deployment Instructions

### On Your Server (3.27.88.221 or 16.176.18.228)

1. **Pull latest code:**
```bash
cd /var/www/AdencERP
git pull origin main
```

2. **Run the database migration:**
```bash
# Connect to your PostgreSQL database
psql -U your_db_user -d your_db_name -f backend-service/migrations/add-employee-info.sql
```

OR if you're using the migration runner:
```bash
cd backend-service
node migrations/run.js
```

3. **Restart the backend service:**
```bash
pm2 restart backend-service
# or
systemctl restart adencerp-backend
```

4. **Rebuild and deploy frontend:**
```bash
cd /var/www/AdencERP
npm install
npm run build
```

5. **Verify the changes:**
- Login as admin
- Go to Users page
- Create or edit a user
- You should see the new fields: Address, Birthday, and Employment Type

## Notes

- All new fields are **optional** (nullable in database)
- Existing users will have NULL values for these fields until updated
- The migration is safe to run on existing databases (uses `ADD COLUMN IF NOT EXISTS`)
- The index on birthday is created for potential future features (birthday reminders, age calculations)

## Rollback (if needed)

If you need to rollback this migration:
```sql
ALTER TABLE users DROP COLUMN IF EXISTS address;
ALTER TABLE users DROP COLUMN IF EXISTS birthday;
ALTER TABLE users DROP COLUMN IF EXISTS employment_type;
DROP INDEX IF EXISTS idx_users_birthday;
```

## Testing

After deployment, test the following:
1. ✅ Create a new user with employee information
2. ✅ Edit an existing user and add employee information
3. ✅ View user list (should not break)
4. ✅ Login functionality (should not be affected)
5. ✅ All existing features continue to work

## Support

If you encounter any issues:
1. Check backend logs: `pm2 logs backend-service`
2. Check database connection
3. Verify migration was applied: `\d users` in psql
