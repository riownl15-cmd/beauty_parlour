import { useState, useEffect } from 'react';
import { supabase, type Product, type StockMovement } from '../lib/supabase';
import { Plus, Package, TrendingUp, TrendingDown, Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import StockEntryForm from './StockEntryForm';

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [movements, dateFrom, dateTo]);

  const loadData = async () => {
    try {
      const [productsResult, movementsResult] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase
          .from('stock_movements')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (productsResult.error) throw productsResult.error;
      if (movementsResult.error) throw movementsResult.error;

      setProducts(productsResult.data || []);
      setMovements(movementsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMovements = () => {
    const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
    const toDate = new Date(dateTo).setHours(23, 59, 59, 999);

    const filtered = movements.filter((movement) => {
      const movementDate = new Date(movement.created_at).getTime();
      return movementDate >= fromDate && movementDate <= toDate;
    });

    setFilteredMovements(filtered);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Date & Time', 'Product', 'Type', 'Quantity', 'Notes'];
    const data = filteredMovements.map((movement) => [
      formatDate(movement.created_at),
      getProductName(movement.product_id),
      movement.movement_type,
      movement.quantity.toString(),
      movement.notes || '-',
    ]);

    const csv = [headers, ...data].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-movements-${dateFrom}-${dateTo}.csv`;
    a.click();
  };

  const handleFormClose = () => {
    setShowForm(false);
    loadData();
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredMovements.length / rowsPerPage);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const lowStockProducts = products.filter((p) => p.stock_qty <= p.low_stock_threshold);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Stock Management</h2>
          <p className="text-gray-600 mt-1">Track inventory and manage stock levels</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors active:scale-98 text-base w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Stock</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Products</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{products.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Low Stock Alerts</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{lowStockProducts.length}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <TrendingDown className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Stock Value</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                ₹
                {products
                  .reduce((sum, p) => sum + p.stock_qty * p.purchase_price, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{product.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                    {product.stock_qty} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Stock Movements</h3>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors active:scale-95 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No stock movements found</p>
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {getProductName(movement.product_id)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          movement.movement_type === 'purchase'
                            ? 'bg-green-100 text-green-700'
                            : movement.movement_type === 'sale'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {movement.movement_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {movement.quantity > 0 ? '+' : ''}
                        {movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{movement.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredMovements.length)} of {filteredMovements.length} movements
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && <StockEntryForm products={products} onClose={handleFormClose} />}
    </div>
  );
}