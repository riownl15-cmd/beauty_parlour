import { useState, useEffect } from 'react';
import { supabase, type Product } from '../lib/supabase';
import { Search, Printer, Download, Barcode as BarcodeIcon } from 'lucide-react';

export default function BarcodePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

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
    const barWidth = 3;
    const barHeight = 100;
    const width = code.length * barWidth * 8;
    const height = barHeight + 40;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${width}" height="${height}" fill="white"/>`;

    let xPos = 10;
    for (const digit of code) {
      const bits = getBarPattern(digit);
      for (const bit of bits) {
        if (bit === '1') {
          svg += `<rect x="${xPos}" y="10" width="${barWidth}" height="${barHeight}" fill="black"/>`;
        }
        xPos += barWidth;
      }
    }

    svg += `<text x="${width / 2}" y="${barHeight + 30}" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">${code}</text>`;
    svg += `</svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const getBarPattern = (digit: string): string => {
    const patterns: Record<string, string> = {
      '0': '11011001100',
      '1': '11001101100',
      '2': '11001100110',
      '3': '10010011000',
      '4': '10010001100',
      '5': '10001001100',
      '6': '10011001000',
      '7': '10011000100',
      '8': '10001100100',
      '9': '11010001100',
      A: '11001011000',
      B: '11001000110',
      C: '11000101110',
      D: '11000100100',
      E: '11000010100',
      F: '11000001010',
    };

    return patterns[digit] || '00000000';
  };

  const convertSvgToPng = async (svgDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = reject;
      img.src = svgDataUrl;
    });
  };

  const downloadBarcode = async (product: Product) => {
    if (!product.barcode) return;

    try {
      const svgDataUrl = generateBarcodeImage(product.barcode);
      const pngDataUrl = await convertSvgToPng(svgDataUrl);

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
            size: 80mm 40mm;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 80mm;
            height: 40mm;
            padding: 4mm;
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
          .product-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 4mm;
            text-transform: uppercase;
          }
          .barcode-container {
            margin: 2mm 0;
          }
          .barcode-container img {
            max-width: 70mm;
            height: auto;
          }
          .price {
            font-size: 16px;
            font-weight: bold;
            margin-top: 2mm;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="product-name">${product.name}</div>
          <div class="barcode-container">
            <img src="${barcodeImage}" alt="Barcode" />
          </div>
          <div class="price">₹${product.sale_price.toFixed(2)}</div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 250);
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
