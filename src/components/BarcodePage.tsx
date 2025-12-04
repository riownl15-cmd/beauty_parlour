import { useState, useEffect } from 'react';
import { supabase, type Product } from '../lib/supabase';
import { Search, Printer, Download, Barcode as BarcodeIcon } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export default function BarcodePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    loadProducts();
    loadSettings();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['store_name']);

      if (error) throw error;

      const settings: Record<string, string> = {};
      data?.forEach((setting) => {
        settings[setting.key] = setting.value;
      });

      setStoreName(settings.store_name || 'Smile Struck Bridal Studios');
    } catch (error) {
      console.error('Error loading settings:', error);
      setStoreName('Smile Struck Bridal Studios');
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('barcode', 'is', null)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.barcode?.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  };

  const generateBarcodeImage = (code: string): string => {
    try {
      const canvas = document.createElement('canvas');

      JsBarcode(canvas, code, {
        format: 'CODE128',
        width: 3,
        height: 100,
        displayValue: true,
        fontSize: 18,
        fontOptions: 'bold',
        margin: 15,
        background: '#ffffff',
        lineColor: '#000000'
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating barcode:', error);
      return '';
    }
  };

  const downloadBarcode = (product: Product) => {
    if (!product.barcode) return;

    try {
      const pngDataUrl = generateBarcodeImage(product.barcode);

      if (!pngDataUrl) {
        alert('Failed to generate barcode');
        return;
      }

      const link = document.createElement('a');
      link.href = pngDataUrl;
      link.download = `barcode-${product.sku}-${product.barcode}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading barcode:', error);
      alert('Failed to download barcode');
    }
  };

  const printLabel = (product: Product) => {
    if (!product.barcode) return;

    const barcodeImage = generateBarcodeImage(product.barcode);

    if (!barcodeImage) {
      alert('Failed to generate barcode image');
      return;
    }

    const logoUrl = window.location.origin + '/asset_2smile_struct.png';

    const labelHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Barcode Label - ${product.name}</title>
        <style>
          @page {
            size: 38.1mm 25.4mm;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 38.1mm;
            height: 25.4mm;
            padding: 1mm;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: white;
          }
          .label {
            text-align: center;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .logo {
            width: 12mm;
            height: auto;
            margin-bottom: 0.5mm;
          }
          .product-name {
            font-size: 6px;
            font-weight: bold;
            margin-bottom: 0.5mm;
            text-transform: uppercase;
            color: #000;
            line-height: 1.1;
            max-height: 8px;
            overflow: hidden;
          }
          .barcode-container {
            margin: 0.3mm 0;
            display: flex;
            justify-content: center;
            width: 100%;
          }
          .barcode-container img {
            max-width: 36mm;
            height: auto;
            max-height: 12mm;
          }
          .price {
            font-size: 7px;
            font-weight: bold;
            margin-top: 0.3mm;
            color: #000;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <img src="${logoUrl}" class="logo" alt="Logo" onerror="this.style.display='none'" />
          <div class="product-name">${product.name}</div>
          <div class="barcode-container">
            <img src="${barcodeImage}" alt="Barcode" id="barcodeImg" />
          </div>
          <div class="price">₹${product.sale_price.toFixed(2)}</div>
        </div>
        <div style="position: fixed; top: 5px; right: 5px; z-index: 9999; display: flex; gap: 5px;">
          <button onclick="window.print()" style="background: #4CAF50; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
            🖨️ Print
          </button>
          <button onclick="window.close()" style="background: #f44336; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
            ✕ Close
          </button>
        </div>
        <style>
          @media print {
            button { display: none !important; }
          }
        </style>
        <script>
          (function() {
            var allImages = document.images;
            var imagesLoaded = 0;
            var totalImages = allImages.length;
            var printTriggered = false;

            function tryPrint() {
              if (!printTriggered) {
                printTriggered = true;
                setTimeout(function() {
                  window.print();
                }, 800);
              }
            }

            if (totalImages === 0) {
              tryPrint();
            } else {
              for (var i = 0; i < totalImages; i++) {
                var img = allImages[i];
                if (img.complete) {
                  imageLoaded();
                } else {
                  img.addEventListener('load', imageLoaded);
                  img.addEventListener('error', imageLoaded);
                }
              }
            }

            function imageLoaded() {
              imagesLoaded++;
              if (imagesLoaded === totalImages) {
                tryPrint();
              }
            }

            window.addEventListener('load', function() {
              if (!printTriggered && imagesLoaded === totalImages) {
                tryPrint();
              }
            });
          })();
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([labelHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

    const printWindow = window.open(blobUrl, '_blank');

    if (!printWindow) {
      URL.revokeObjectURL(blobUrl);
      alert('Failed to open print window. Please allow popups for this site and try again.');
      return;
    }

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Barcode Management</h2>
          <p className="text-gray-600 mt-1">Print labels and download barcodes for products</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Products with Barcodes ({filteredProducts.length})
          </h3>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <BarcodeIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No products with barcodes found</p>
            <p className="text-gray-400 text-sm mt-2">
              Add barcodes to products in the Products section
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h4 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h4>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  <p className="text-lg font-semibold text-blue-600 mt-2">
                    ₹{product.sale_price.toFixed(2)}
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mb-4">
                  <img
                    src={generateBarcodeImage(product.barcode!)}
                    alt="Barcode"
                    className="w-full h-auto"
                  />
                  <p className="text-center text-xs font-mono text-gray-700 mt-2">
                    {product.barcode}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => printLabel(product)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Label</span>
                  </button>
                  <button
                    onClick={() => downloadBarcode(product)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
