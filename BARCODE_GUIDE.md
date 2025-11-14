# Barcode Management Guide

## Overview
The billing software includes built-in barcode scanning and search functionality. Barcodes can be entered manually or scanned using a USB barcode scanner.

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
