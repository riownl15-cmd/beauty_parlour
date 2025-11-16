# Beauty Parlour Billing Software - Quick Start Guide

## What You Have

A fully functional, production-ready billing software for your beauty parlour with:
- Category management
- Product/cosmetics inventory
- Service management
- Stock tracking with alerts
- Invoice creation and printing
- Sales reports and analytics
- Settings management

## 5-Minute Setup

### Step 1: Verify Database Connection
1. Check your `.env` file has Supabase credentials
2. Open the app in your browser
3. Try adding a test category in the Categories page

### Step 2: Set Up Your Store
1. Go to **Settings** (bottom of left menu)
2. Enter your store name, address, and phone
3. Set default tax rate (usually 18% in India)
4. Click **Save Settings**

### Step 3: Add Categories
1. Go to **Categories**
2. Click **Add Category**
3. Enter category names like "Skincare", "Makeup", "Haircare"
4. Add descriptions if you want
5. Click **Add Category**

Sample categories are pre-loaded, but add your own!

### Step 4: Add Products
1. Go to **Products**
2. Click **Add Product**
3. Fill in:
   - SKU (unique identifier like "SK001")
   - Barcode (optional, for scanner)
   - Product name
   - Category
   - Purchase price
   - Sale price
   - Tax rate (auto-filled from settings)
   - Stock quantity
   - Low stock threshold
4. Click **Add Product**

### Step 5: Add Services
1. Go to **Services**
2. Click **Add Service**
3. Enter service name, price, and duration
4. Click **Add Service**

### Step 6: Add Stock
1. Go to **Stock**
2. Click **Add Stock**
3. Select product and quantity
4. Click **Add Stock Entry**

### Step 7: Create Your First Invoice
1. Go to **Billing**
2. Search for products or scan barcode
3. Click product to add to cart
4. Adjust quantity with +/- buttons
5. Add services from the search results
6. Enter customer details (optional)
7. Apply discount if needed
8. Click **Checkout & Print**
9. Preview invoice and print

### Step 8: View Reports
1. Go to **Reports**
2. Select date range
3. View:
   - Total sales
   - Total profit
   - Top selling products
   - Low stock alerts
   - Export to CSV

## Common Operations

### Add Multiple Products Quickly
1. Go to Products
2. Click "Add Product"
3. Fill minimum fields (SKU, Name, Prices)
4. Save and repeat

### Update Product Stock
1. Go to Stock
2. Click "Add Stock"
3. Select product and enter quantity
4. Leave notes about the purchase
5. Save

### Print Invoice
1. After checkout, click Print in the preview
2. Select your printer
3. Print as PDF to save receipts

### View Sales History
1. Go to Reports
2. Select "Last 7 days"
3. See all key metrics
4. Export data if needed

## Understanding Each Page

### Billing
- Create invoices
- Add products and services to cart
- Apply discounts and taxes
- Print receipts

### Products
- Manage your cosmetics inventory
- Track SKU and barcodes
- Set purchase/sale prices
- Monitor stock levels

### Categories
- Organize products
- Create product groups
- Edit or delete categories

### Services
- List your beauty services
- Set pricing and duration
- Activate/deactivate services

### Stock
- Add inventory purchases
- Track stock movements
- View low stock alerts
- See total stock value

### Reports
- Daily/periodic sales data
- Profit calculations
- Top products
- Low stock alerts
- Export reports to CSV

### Settings
- Store information
- Invoice numbering
- Default tax rates
- Store branding

## Keyboard Shortcuts

- **Enter** - When scanning barcodes, confirms search
- **Tab** - Move between form fields
- **Ctrl+P** - Print current page

## Tips for Best Results

1. **SKUs:** Use consistent format like "PROD001", "PROD002"
2. **Barcodes:** Scan or enter exact barcode number
3. **Prices:** Keep decimal prices (e.g., 299.99)
4. **Stock threshold:** Set to about 20% of normal stock level
5. **Tax rates:** Can be different per product if needed
6. **Backups:** Regularly export reports to CSV for backup

## When to Use Each Feature

| Task | Where |
|------|-------|
| Create a sale | Billing |
| Add new product | Products |
| Organize products | Categories |
| Add beauty services | Services |
| Purchase inventory | Stock |
| Check sales data | Reports |
| Customize settings | Settings |

## Troubleshooting Quick Fixes

**"Error saving..."**
- Refresh page (F5)
- Check all required fields are filled
- Check browser console (F12) for details

**Can't add products to category**
- Create categories first
- Refresh Products page
- Try again

**Stock not updating**
- Wait a moment for sync
- Refresh the Stock page
- Check Stock Movements for the sale

**Invoice not printing**
- Wait for preview to fully load
- Click Print button in preview
- Check popup blocker settings

## Support Resources

1. **Troubleshooting Guide** - See TROUBLESHOOTING.md
2. **Setup Guide** - See SETUP_GUIDE.md
3. **Barcode Guide** - See BARCODE_GUIDE.md
4. **Browser Console** - Press F12 for error details

## You're Ready!

The software is production-ready. Start using it immediately to manage your beauty parlour billing!

## Next Steps

1. Test with sample data
2. Add your real products
3. Create a few test invoices
4. Verify printing works
5. Export a report
6. Start taking real orders!

Enjoy your new billing system!