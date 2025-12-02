# Barcode Generator & Scanner Guide

## Overview

Your beauty parlour billing software now includes:
- **Barcode Generator** - Create barcodes for your products
- **Barcode Scanner Support** - Use USB scanners for fast checkout
- **Multiple Formats** - CODE128, EAN13, UPC support

## Using the Barcode Generator

### Step 1: Open Product Form
1. Go to **Products** page
2. Click **Add Product** or edit existing product
3. Locate the **Barcode** field

### Step 2: Generate Barcode
1. Click the **barcode icon** button next to the Barcode field
2. Enter product details if not already filled
3. Select barcode type:
   - **CODE128** - Alphanumeric (letters & numbers)
   - **EAN13** - Standard retail barcode (13 digits)
   - **UPC** - Universal Product Code (12 digits)

### Step 3: Generate & Use
1. Click **Generate Barcode**
2. You'll see:
   - Visual barcode image
   - Barcode number
   - Copy button
   - Download button
3. Click **Use This Barcode** to add it to your product
4. The barcode will be saved with your product

### Step 4: Save Product
1. Fill other product details
2. Click **Add Product** or **Update Product**
3. Barcode is now linked to your product

## Barcode Types Explained

### CODE128 (Alphanumeric)
- **Best for:** Internal use, custom codes
- **Format:** Mix of letters and numbers
- **Length:** Up to 12 characters
- **Example:** PROD123ABC
- **Use case:** Your own product codes

### EAN13 (Standard Retail)
- **Best for:** Retail products, standard barcodes
- **Format:** 13 digits only
- **Length:** Exactly 13 digits
- **Example:** 1234567890123
- **Use case:** International standard

### UPC (Universal Product Code)
- **Best for:** US/Canada retail
- **Format:** 12 digits only
- **Length:** Exactly 12 digits
- **Example:** 123456789012
- **Use case:** North American products

## Using USB Barcode Scanners

### Hardware Setup

#### Scanner Types Supported
- USB Laser Scanners
- USB 2D Scanners (QR + Barcode)
- USB Image-based Scanners
- USB Wireless Receivers

#### Connection Steps
1. Plug USB scanner into your computer
2. Wait for Windows/Mac to recognize
3. No driver installation needed (most modern scanners)
4. Open the Billing page
5. Click in the search box
6. Scan a product barcode

### Using Scanner in Billing

#### Step 1: Start Billing
1. Go to **Billing** page
2. See the search field at the top

#### Step 2: Scan Product
1. Click in the **search box**
2. Position product barcode under scanner
3. Trigger scanner (usually by button on scanner)
4. Product automatically appears in results
5. Click product name to add to cart

#### Step 3: Quick Checkout
1. Scan multiple products quickly
2. Adjust quantities with +/- buttons
3. Apply discounts if needed
4. Click **Checkout & Print**
5. Print invoice

### Scanner Tips

**Positioning:**
- Hold barcode flat against scanner window
- Keep about 2-3 inches distance
- Scan from different angles if needed

**Speed:**
- Most scanners work instantly
- If scanning fails, try again
- Move slowly across barcode

**Troubleshooting:**
- If scanner not working, ensure USB is plugged in
- Test scanner with another app first
- Some scanners need configuration via app settings
- Try different barcode angles

## How to Use Barcodes

### Adding Barcodes to Products
1. Go to **Products** page
2. Click **Add Product** or **Edit** an existing product
3. Enter the barcode in the **Barcode** field
4. Save the product

### Using Barcode Scanner in Billing
1. Go to **Billing** page
2. Locate the **Barcode Scanner** section at the top
3. Either:
   - Scan a barcode using your USB scanner (it will auto-fill the input)
   - Manually type the barcode and press Enter or click Search
4. If the product is found, it will be automatically added to the cart

### Barcode Scanner Hardware
- Any USB barcode scanner that emulates keyboard input will work
- Most barcode scanners are plug-and-play
- Scanner should be configured to send "Enter" key after scanning

## Generating Barcodes

To generate physical barcode labels, you can:

1. **Use Online Tools:**
   - [Barcode Generator](https://www.barcodesinc.com/generator/)
   - [Free Barcode Generator](https://barcode.tec-it.com/)

2. **Use Desktop Software:**
   - Bartender
   - ZebraDesigner
   - NiceLabel

3. **Print Labels:**
   - Generate barcode images for your SKUs
   - Print on standard label sheets (Avery compatible)
   - Use a thermal label printer for better quality

## Best Practices

- Use consistent barcode format (EAN-13, Code 128, etc.)
- Test each barcode after printing to ensure scannability
- Keep barcodes unique for each product
- Store barcode values in the system when adding products
- Consider using SKU as barcode if you don't have existing barcodes

## Troubleshooting

**Scanner not working?**
- Check USB connection
- Try scanning in a text editor to verify scanner works
- Ensure scanner is set to "Enter" suffix mode

**Product not found?**
- Verify barcode is correctly saved in the product record
- Check for extra spaces or characters
- Ensure barcode matches exactly (case-sensitive)
