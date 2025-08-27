# Database Migration: Add Completed Dumpster Tracking

## 🎯 Purpose

This migration adds fields to the `orders` table to track which dumpster was used when an order was completed, allowing for historical tracking even after the dumpster is freed for new assignments.

## 📋 Instructions

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration

Copy and paste the following SQL into the SQL Editor and click **Run**:

```sql
-- Migration to add dumpster tracking fields for completed orders
-- This allows us to keep a record of which dumpster was used for each completed order
-- even after the dumpster has been freed for new assignments

-- Add columns to store completed order dumpster information
ALTER TABLE orders ADD COLUMN completed_with_dumpster_id uuid;
ALTER TABLE orders ADD COLUMN completed_with_dumpster_name text;

-- Add foreign key constraint to reference dumpsters table
ALTER TABLE orders ADD CONSTRAINT fk_completed_dumpster
  FOREIGN KEY (completed_with_dumpster_id) REFERENCES dumpsters(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_orders_completed_dumpster_id ON orders(completed_with_dumpster_id);

-- Add comments to document the new columns
COMMENT ON COLUMN orders.completed_with_dumpster_id IS 'ID of the dumpster that was used when this order was completed (preserved for historical tracking)';
COMMENT ON COLUMN orders.completed_with_dumpster_name IS 'Name of the dumpster that was used when this order was completed (for easy display without joins)';
```

### Step 3: Verify Migration

After running the migration, you should see:

- ✅ **Success message** in the SQL Editor
- 🔧 **New columns added** to the orders table:
  - `completed_with_dumpster_id` (uuid, nullable)
  - `completed_with_dumpster_name` (text, nullable)
- 🔗 **Foreign key constraint** linking to dumpsters table
- 📊 **Database index** for better query performance

## 🔍 How It Works

### Before Completion:

- Order has `dumpster_id` pointing to assigned dumpster
- Dumpster has `status: 'assigned'` and `current_order_id` pointing to order

### During Completion:

1. ✅ **Copy dumpster info** to `completed_with_dumpster_id` and `completed_with_dumpster_name`
2. ✅ **Set order status** to 'completed'
3. ✅ **Free the dumpster** (status: 'available', current_order_id: null)
4. ✅ **Clear order's dumpster_id** (optional, as it's no longer actively assigned)

### After Completion:

- ✅ **Order preserves** historical dumpster information
- ✅ **Dumpster is available** for new assignments
- ✅ **UI shows** "Dumpster Used: D001" instead of assignment dropdown

## 🚨 Important Notes

- This migration is **non-destructive** - no existing data is modified
- The new columns will be `NULL` for existing completed orders
- Only **new completions** will populate these fields
- The application will continue to work without the migration (fields will just be NULL)

## 🧪 Testing

After running the migration:

1. Assign a dumpster to an active order
2. Complete the order
3. Check that the UI shows "Dumpster Used: [DumpsterName]"
4. Verify the dumpster is now available for new assignments
5. Check the database to confirm the new columns contain the correct data
