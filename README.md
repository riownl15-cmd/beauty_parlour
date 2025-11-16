# Beauty Parlour Billing Software

A complete, production-ready billing and inventory management system designed specifically for beauty parlours, cosmetics shops, and salon businesses.

## ✅ Features

### Billing & Invoicing
- ✅ Create professional invoices
- ✅ Barcode scanning support (USB scanner compatible)
- ✅ Product and service billing
- ✅ Apply discounts (percentage or fixed amount)
- ✅ Automatic tax calculation
- ✅ Multiple payment methods (Cash, Card, UPI)
- ✅ Customer information capture
- ✅ Print receipts (A4/Thermal compatible)
- ✅ Invoice preview before printing

### Inventory Management
- ✅ Product catalog with SKU and barcode
- ✅ Category-based organization
- ✅ Purchase and sale price tracking
- ✅ Stock quantity management
- ✅ Low stock alerts
- ✅ Stock movement history
- ✅ Automatic stock deduction on sales

### Product Management
- ✅ Add/edit/delete products
- ✅ Organize by categories
- ✅ Product images support
- ✅ Individual tax rates per product
- ✅ Low stock threshold alerts
- ✅ Barcode tracking

### Service Management
- ✅ Add beauty services
- ✅ Set service duration
- ✅ Dynamic pricing
- ✅ Service activation/deactivation
- ✅ Include services in invoices

### Category Management
- ✅ Create custom categories
- ✅ Organize products efficiently
- ✅ Search functionality
- ✅ Edit and delete categories

### Analytics & Reports
- ✅ Daily/periodic sales reports
- ✅ Profit calculations
- ✅ Top-selling products analysis
- ✅ Stock movement tracking
- ✅ Low stock product list
- ✅ Export to CSV for spreadsheets
- ✅ Date range filtering

### Store Settings
- ✅ Store information management
- ✅ Invoice numbering customization
- ✅ Default tax rate configuration
- ✅ Business branding options

### Additional Features
- ✅ User audit trail (who created which invoice)
- ✅ Real-time data synchronization
- ✅ Professional UI/UX
- ✅ Responsive design
- ✅ Complete error handling

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
Ensure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## 📋 Getting Started

1. **Read QUICKSTART.md** - 5-minute setup guide
2. **Read SETUP_GUIDE.md** - Detailed feature overview
3. **Read BARCODE_GUIDE.md** - Barcode scanner setup
4. **Read TROUBLESHOOTING.md** - Common issues and fixes

## 🗂️ File Structure

```
src/
├── components/
│   ├── Layout.tsx                 # Main navigation
│   ├── BillingPage.tsx            # Invoice creation
│   ├── ProductsPage.tsx           # Product management
│   ├── ProductForm.tsx            # Product add/edit
│   ├── CategoriesPage.tsx         # Category management
│   ├── CategoryForm.tsx           # Category add/edit
│   ├── ServicesPage.tsx           # Service management
│   ├── ServiceForm.tsx            # Service add/edit
│   ├── StockPage.tsx              # Stock tracking
│   ├── StockEntryForm.tsx         # Stock add/edit
│   ├── ReportsPage.tsx            # Analytics and reports
│   ├── SettingsPage.tsx           # Store settings
│   └── InvoicePreview.tsx         # Invoice display/print
├── lib/
│   └── supabase.ts                # Database client & types
├── App.tsx                        # Main app component
└── index.css                      # Global styles
```

## 🔧 Technology Stack

- **Frontend:** React 18 + TypeScript
- **UI Framework:** Tailwind CSS
- **Icons:** Lucide React
- **Database:** Supabase (PostgreSQL)
- **Build:** Vite
- **Styling:** Responsive design with mobile support

## 📊 Database Schema

### Tables
- **categories** - Product categories
- **products** - Product inventory
- **services** - Beauty services
- **stock_movements** - Inventory tracking
- **invoices** - Sales records
- **invoice_items** - Invoice line items
- **settings** - Application settings
- **users** - User management

### Row Level Security (RLS)
All tables have RLS enabled for security:
- SELECT - Read all records
- INSERT - Create new records
- UPDATE - Modify existing records
- DELETE - Remove records

## 🔐 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Input validation on all forms
- ✅ Unique constraints on SKU and barcodes
- ✅ Secure database connection
- ✅ Error handling and logging

## 💾 Data Features

- ✅ Real-time data synchronization
- ✅ Automatic timestamps on all records
- ✅ Complete audit trail
- ✅ Data export capability (CSV)
- ✅ No data loss on operations

## 🎨 UI/UX Features

- ✅ Clean, professional design
- ✅ Intuitive navigation
- ✅ Responsive on all screen sizes
- ✅ Comprehensive feedback messages
- ✅ Easy-to-use forms
- ✅ Real-time search
- ✅ Data tables with sorting

## 🛠️ Available Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
```

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎯 Use Cases

- **Beauty Salons** - Complete salon management
- **Cosmetics Shops** - Retail inventory and billing
- **Parlours** - Service and product billing
- **Beauty Centers** - Multi-service management
- **Small Businesses** - Professional invoicing

## ⚡ Performance

- Fast invoice creation
- Instant product updates
- Real-time stock sync
- Responsive UI
- Optimized database queries

## 🔄 Workflow Example

1. **Set Up Store** → Go to Settings
2. **Add Categories** → Go to Categories
3. **Add Products** → Go to Products
4. **Add Services** → Go to Services
5. **Stock Up** → Go to Stock
6. **Create Invoice** → Go to Billing
7. **View Reports** → Go to Reports

## 📈 Scalability

- Handles thousands of products
- Unlimited invoices
- Efficient stock tracking
- Fast report generation
- Optimized for growth

## 🆘 Support Resources

- **QUICKSTART.md** - 5-minute setup
- **SETUP_GUIDE.md** - Complete setup
- **BARCODE_GUIDE.md** - Barcode scanner
- **TROUBLESHOOTING.md** - Common fixes

## 🎓 Training Materials

Each guide includes:
- Step-by-step instructions
- Screenshots and examples
- Common issues and solutions
- Best practices
- Keyboard shortcuts

## 🚀 Deployment

Ready for deployment on:
- Local servers
- Cloud providers
- Docker containers
- Vercel
- Netlify
- Any static host

## 📝 License

This software is provided as-is for your business use.

## 🎉 Ready to Use!

Everything is configured and working. Start using it immediately:

1. Open the application
2. Set up your store in Settings
3. Add categories and products
4. Create your first invoice
5. Print and manage your sales

**No additional configuration needed!**

---

**Created for Beauty Parlours & Cosmetics Businesses**

Built with ❤️ for easy, professional billing and inventory management.