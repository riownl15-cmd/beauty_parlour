import { useState } from 'react';
import { supabase, type Product } from '../lib/supabase';
import { X } from 'lucide-react';

type StockEntryFormProps = {
  products: Product[];
  onClose: () => void;
};

export default function StockEntryForm({ products, onClose }: StockEntryFormProps) {
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: 'purchase' as 'purchase' | 'adjustment',
    quantity: '',
    purchase_price: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quantity = parseInt(formData.quantity);
      const product = products.find((p) => p.id === formData.product_id);

      if (!product) throw new Error('Product not found');

      const movementData = {
        product_id: formData.product_id,
        movement_type: formData.movement_type,
        quantity: quantity,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        notes: formData.notes,
        created_at: new Date().toISOString(),
      };

      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([movementData]);

      if (movementError) throw movementError;

      const newStockQty = product.stock_qty + quantity;

      const { error: productError } = await supabase
        .from('products')
        .update({
          stock_qty: newStockQty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.product_id);

      if (productError) throw productError;

      onClose();
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Error adding stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === formData.product_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">Add Stock Entry</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku}) - Current Stock: {product.stock_qty}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Movement Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.movement_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  movement_type: e.target.value as 'purchase' | 'adjustment',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="purchase">Purchase (Add Stock)</option>
              <option value="adjustment">Adjustment (Add/Remove)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Use negative numbers to reduce stock"
            />
            {selectedProduct && formData.quantity && (
              <p className="text-sm text-gray-600 mt-1">
                New stock will be: {selectedProduct.stock_qty + parseInt(formData.quantity)} units
              </p>
            )}
          </div>

          {formData.movement_type === 'purchase' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price per Unit (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Optional notes about this stock movement"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Stock Entry'}
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
      </div>
    </div>
  );
}