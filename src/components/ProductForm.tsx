import { useState, useEffect } from 'react';
import { supabase, type Product, type Category } from '../lib/supabase';
import { X, Barcode as BarcodeIcon } from 'lucide-react';
import BarcodeGenerator from './BarcodeGenerator';

type ProductFormProps = {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
};

export default function ProductForm({ product, categories, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    category_id: '',
    purchase_price: '',
    sale_price: '',
    tax_rate: '18',
    stock_qty: '0',
    low_stock_threshold: '10',
    image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        barcode: product.barcode || '',
        name: product.name,
        category_id: product.category_id || '',
        purchase_price: product.purchase_price.toString(),
        sale_price: product.sale_price.toString(),
        tax_rate: product.tax_rate.toString(),
        stock_qty: product.stock_qty.toString(),
        low_stock_threshold: product.low_stock_threshold.toString(),
        image_url: product.image_url || '',
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        sku: formData.sku,
        barcode: formData.barcode || null,
        name: formData.name,
        category_id: formData.category_id || null,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        stock_qty: parseInt(formData.stock_qty) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        image_url: formData.image_url || '',
        updated_at: new Date().toISOString(),
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) {
          console.error('Supabase update error:', error);
          throw new Error(error.message || 'Failed to update product');
        }
      } else {
        const { error } = await supabase.from('products').insert([productData]);

        if (error) {
          console.error('Supabase insert error:', error);
          throw new Error(error.message || 'Failed to create product');
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error saving product. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowBarcodeGenerator(true)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                  title="Generate barcode"
                >
                  <BarcodeIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Price (₹) - Tax Inclusive <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Price includes tax</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                value={formData.stock_qty}
                onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={formData.low_stock_threshold}
              onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {showBarcodeGenerator && (
          <BarcodeGenerator
            productName={formData.name || 'Product'}
            onBarcodeGenerated={(barcode) => {
              setFormData({ ...formData, barcode });
              setShowBarcodeGenerator(false);
            }}
            onClose={() => setShowBarcodeGenerator(false)}
          />
        )}
      </div>
    </div>
  );
}