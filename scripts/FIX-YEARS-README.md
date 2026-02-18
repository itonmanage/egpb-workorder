# Fix Buddhist Era Years Script

## ⚠️ IMPORTANT - READ BEFORE RUNNING

This script will convert all ticket dates from year 2568 (Buddhist Era) to year 2025 (Gregorian Calendar).

**What it does:**
- Finds all IT and Engineer tickets with year 2568
- Converts their `createdAt` and `updatedAt` dates by subtracting 543 years
- Verifies the conversion was successful

**Affected Data:**
- IT Tickets: ~80 tickets
- Engineer Tickets: ~365 tickets

## How to Run

```powershell
# Make sure you're in the project directory
cd f:\ticket-form-app

# Run the script
node scripts/fix-buddhist-era-years.js
```

## What to Expect

The script will:
1. Show how many tickets need conversion
2. Convert each ticket (this may take a few minutes)
3. Verify that all tickets are now in year 2025
4. Display final counts

## After Running

1. Restart the application: `pm2 restart ticket-app`
2. Check the summary pages - totals should now match
3. Verify the comparison table shows correct data

## Backup

**IMPORTANT:** This script modifies the database directly. If you want to be extra safe, create a backup first:

```powershell
# Backup the database (if using PostgreSQL)
pg_dump -U your_username your_database > backup_before_year_fix.sql
```

## Rollback (if needed)

If something goes wrong, you can restore from backup or manually convert back by adding 543 years.
