import { useState, useEffect } from 'react';
import { supabase, type Product, type Category } from '../lib/supabase';
import { Plus, Edit2, Trash2, Package, Search, AlertCircle, Printer } from 'lucide-react';
import ProductForm from './ProductForm';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSettings();
  }, []);

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  const getCategoryName = (categoryId: string | null) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const generateBarcodeImage = (code: string): string => {
    const barWidth = 4;
    const barHeight = 120;
    const quietZone = 40;

    const binaryString = encodeToCODE128(code);
    const totalWidth = (binaryString.length * barWidth) + (quietZone * 2);
    const totalHeight = barHeight + 60;

    let svg = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;

    let xPos = quietZone;
    for (let i = 0; i < binaryString.length; i++) {
      if (binaryString[i] === '1') {
        svg += `<rect x="${xPos}" y="20" width="${barWidth}" height="${barHeight}" fill="black"/>`;
      }
      xPos += barWidth;
    }

    svg += `<text x="${totalWidth / 2}" y="${barHeight + 45}" font-size="16" font-family="Arial, sans-serif" text-anchor="middle" font-weight="bold">${code}</text>`;
    svg += `</svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const encodeToCODE128 = (data: string): string => {
    const CODE128_B: Record<string, string> = {
      '0': '11011001100', '1': '11001101100', '2': '11001100110', '3': '10010011000',
      '4': '10010001100', '5': '10001001100', '6': '10011001000', '7': '10011000100',
      '8': '10001100100', '9': '11001001100', 'A': '11001000110', 'B': '10110011000',
      'C': '10011011000', 'D': '10011000110', 'E': '10110001100', 'F': '10001101100',
      'G': '10001100110', 'H': '11001100100', 'I': '11000110100', 'J': '11000100110',
      'K': '10110011100', 'L': '10011011100', 'M': '10011001110', 'N': '10111001100',
      'O': '10011101100', 'P': '10011100110', 'Q': '11001110010', 'R': '11001011100',
      'S': '11001001110', 'T': '11011100100', 'U': '11001110100', 'V': '11101101110',
      'W': '11101001100', 'X': '11100101100', 'Y': '11100100110', 'Z': '11101100100',
      ' ': '11100110100', '!': '11100110010', '"': '11011011000', '#': '11011000110',
      '$': '11000110110', '%': '10100011000', '&': '10001011000', "'": '10001000110',
      '(': '10110001000', ')': '10001101000', '*': '10001100010', '+': '11010001000',
      ',': '11000101000', '-': '11000100010', '.': '10110111000', '/': '10110001110',
    };

    const START_B = '11010010000';
    const STOP = '1100011101011';

    let encoded = START_B;
    let checksum = 104;

    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      const pattern = CODE128_B[char];
      if (pattern) {
        encoded += pattern;
        const charValue = char.charCodeAt(0) - 32;
        checksum += charValue * (i + 1);
      }
    }

    const checksumValue = checksum % 103;
    const checksumChar = String.fromCharCode(checksumValue + 32);
    const checksumPattern = CODE128_B[checksumChar] || '11011001100';
    encoded += checksumPattern;
    encoded += STOP;

    return encoded;
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

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockProducts = products.filter((p) => p.stock_qty <= p.low_stock_threshold);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Products</h2>
          <p className="text-gray-600 mt-1">Manage your cosmetics inventory</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors active:scale-98 text-base w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 lg:p-6 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Low Stock Alert</h3>
              <p className="text-sm text-amber-700 mt-1">
                {lowStockProducts.length} product(s) are running low on stock
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                SKU / Barcode
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Purchase Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sale Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No products found</p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{product.sku}</div>
                      {product.barcode && (
                        <div className="text-gray-500">{product.barcode}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {getCategoryName(product.category_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">₹{product.purchase_price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-900">₹{product.sale_price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        product.stock_qty <= product.low_stock_threshold
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {product.stock_qty} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {product.barcode && (
                        <button
                          onClick={() => printLabel(product)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Print Label"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}