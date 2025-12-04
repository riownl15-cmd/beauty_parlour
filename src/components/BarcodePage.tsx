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

    const printWindow = window.open('', '', 'width=400,height=300');
    if (!printWindow) return;

    const barcodeImage = generateBarcodeImage(product.barcode);

    const labelHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Barcode Label - ${product.name}</title>
        <style>
          @page {
            size: 80mm 50mm;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 80mm;
            height: 50mm;
            padding: 3mm;
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
          }
          .store-name {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 2mm;
            color: #333;
          }
          .product-name {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 2mm;
            text-transform: uppercase;
            color: #000;
          }
          .barcode-container {
            margin: 2mm 0;
            display: flex;
            justify-content: center;
          }
          .barcode-container img {
            max-width: 74mm;
            height: auto;
          }
          .price {
            font-size: 15px;
            font-weight: bold;
            margin-top: 2mm;
            color: #000;
          }
          .price-label {
            font-size: 10px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="store-name">${storeName}</div>
          <div class="product-name">${product.name}</div>
          <div class="barcode-container">
            <img src="${barcodeImage}" alt="Barcode" />
          </div>
          <div class="price">
            <span class="price-label">MRP: </span>₹${product.sale_price.toFixed(2)}
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(labelHTML);
    printWindow.document.close();
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
