# Accounting Migration Guide

This migration adds accounting columns to the transactions table to track the price at the time of each transaction, along with running balance calculations using the **Average Cost Method**.

## What's New

### Database Schema Changes

**New columns in `transactions` table:**
- `price` - The item price at the time of transaction
- `running_qty` - Cumulative quantity balance after this transaction
- `running_value` - Cumulative value balance after this transaction
- `avg_price` - Average cost per unit after this transaction (running_value / running_qty)

**New table:**
- `price_changes` - Audit trail for price changes (optional, for future use)

### API Changes

- **GET /api/transactions** - Now returns the new accounting fields
- **POST /api/transactions** - Now saves accounting data when creating transactions

### UI Changes

- **Reports page** - Now uses transaction price instead of current item price
- **Item detail page** - Shows accounting info card with average price and total stock value
- **Transaction history** - Shows price per transaction

## Migration Steps

### Step 1: Run SQL Migration (Local)

```bash
npx wrangler d1 execute workshop-inventory-db --file=migrations/0005_add_accounting_columns.sql --local
```

### Step 2: Run SQL Migration (Remote/Production)

```bash
npx wrangler d1 execute workshop-inventory-db --file=migrations/0005_add_accounting_columns.sql --remote
```

### Step 3: Backfill Existing Data (Local)

```bash
node migrations/backfill-accounting-data.js --local
```

### Step 4: Backfill Existing Data (Remote/Production)

```bash
node migrations/backfill-accounting-data.js --remote
```

### Step 5: Deploy Updated Code

```bash
npm run deploy
```

## Verification

After migration, verify by:

1. Check a transaction in the database:
```sql
SELECT id, type, quantity, price, running_qty, running_value, avg_price
FROM transactions
LIMIT 5;
```

2. Check the reports page - values should now be accurate regardless of price changes

3. Check an item detail page - should show average price and total stock value

## Rollback (if needed)

To rollback, you would need to:
1. Drop the new columns from transactions table
2. Revert API changes to use item_price from items table
3. Revert UI changes

## Accounting Method: Average Cost

This system uses the **Average Cost Method** for inventory valuation:

```
Harga Rata-rata = Total Nilai Stok ÷ Total Qty Stok
```

Each transaction updates the running values:
- **IN transaction**: Adds quantity and value, recalculates average
- **OUT transaction**: Subtracts quantity and value at current average price
- **ADJUSTMENT**: Adds or subtracts quantity and value proportionally

Example:
| Transaction | Qty | Price | Total | Running Qty | Running Value | Avg Price |
|-------------|-----|-------|-------|-------------|---------------|-----------|
| IN Purchase | 10  | 10,000 | 100,000 | 10 | 100,000 | 10,000 |
| OUT Usage   | -3  | 10,000 | -30,000 | 7 | 70,000 | 10,000 |
| IN Purchase | 5   | 12,000 | 60,000 | 12 | 130,000 | 10,833 |
| OUT Usage   | -4  | 10,833 | -43,333 | 8 | 86,667 | 10,833 |
