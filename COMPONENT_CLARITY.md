# Component Clarity - Payment Management

## Overview
This document provides information about the payment management component in the application.

## Component

### ✅ PaymentManager (ACTIVE)
**File:** `components/admin/payment-manager.tsx`

**Purpose:** Comprehensive payment management component

**Features:**
- Supports ALL payment methods (Square invoices, cash, check, etc.)
- Modern dialog-based UI with proper confirmation dialogs
- Comprehensive payment lifecycle management (create, send, cancel, delete)
- Integration with both payments table and Square API
- Proper error handling and state management

**Currently Used In:**
- `/app/admin/orders/page.tsx` (main orders list)
- `/app/admin/orders/[orderId]/page.tsx` (individual order details)

**Status:** ✅ ACTIVE - The only payment management component

---

## Legacy Component Removed

### ⚠️ SquareInvoiceManager (REMOVED)
**Previous File:** `components/admin/square-invoice-manager.tsx`

**What it was:** Legacy component for Square invoice management only
**Why removed:** Unused in codebase, superseded by PaymentManager
**When removed:** Component cleanup - no breaking changes as it was unused

---

## Decision Matrix

| Need | Use Component |
|------|---------------|
| Any payment management feature | PaymentManager |
| Support multiple payment methods | PaymentManager |
| Modern UI with proper dialogs | PaymentManager |
| Square invoice management | PaymentManager |

## Recent Changes Applied

**Issue:** Delete invoice button was showing browser confirm() alert instead of proper dialog
**Root Cause:** Legacy SquareInvoiceManager was using `confirm()` calls
**Solution:** 
1. Fixed the dialog implementation in both components
2. Removed unused SquareInvoiceManager component
3. Consolidated to single PaymentManager component

## Recommendations

1. **For All Development:** Use PaymentManager
2. **For Maintenance:** All payment features now use PaymentManager
3. **Architecture:** Single component eliminates confusion and maintenance overhead

## File Locations Summary

```
components/admin/
└── payment-manager.tsx       ✅ ACTIVE - Comprehensive payment management

app/admin/orders/
├── page.tsx                  Uses: PaymentManager ✅
└── [orderId]/page.tsx        Uses: PaymentManager ✅
```

## Cleanup Completed

- ✅ Removed unused `SquareInvoiceManager` component
- ✅ Updated documentation to reflect single-component architecture  
- ✅ No breaking changes (component was not imported/used anywhere)
- ✅ Simplified codebase and eliminated confusion