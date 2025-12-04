import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Download,
  Package,
  AlertCircle,
} from 'lucide-react';

type SalesData = {
  totalSales: number;
  totalOrders: number;
  totalProfit: number;
  totalTax: number;
};

type TopProduct = {
  name: string;
  quantity: number;
  revenue: number;
};

type LowStockProduct = {
  id: string;
  name: string;
  sku: string;
  stock_qty: number;
  low_stock_threshold: number;
};

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalOrders: 0,
    totalProfit: 0,
    totalTax: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [dateFrom, dateTo]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const fromDate = new Date(dateFrom).toISOString();
      const toDate = new Date(new Date(dateTo).setHours(23, 59, 59)).toISOString();

      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .gte('created_at', fromDate)
        .lte('created_at', toDate);

      if (invoicesError) throw invoicesError;

      const totalSales = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
      const totalOrders = invoices?.length || 0;
      const totalTax = invoices?.reduce((sum, inv) => sum + inv.tax_amount, 0) || 0;

      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*, invoices!inner(created_at)')
        .gte('invoices.created_at', fromDate)
        .lte('invoices.created_at', toDate);

      if (itemsError) throw itemsError;

      const productSales = new Map<string, { quantity: number; revenue: number }>();

      items?.forEach((item) => {
        if (item.item_type === 'product') {
          const existing = productSales.get(item.item_name) || { quantity: 0, revenue: 0 };
          productSales.set(item.item_name, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + item.total_amount,
          });
        }
      });

      const topProductsList = Array.from(productSales.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setTopProducts(topProductsList);

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, stock_qty, low_stock_threshold, purchase_price, sale_price');

      if (productsError) throw productsError;

      const lowStock = products?.filter((p) => p.stock_qty <= p.low_stock_threshold) || [];
      setLowStockProducts(lowStock);

      const productItems = items?.filter((item) => item.item_type === 'product' && item.product_id);
      let totalCost = 0;

      for (const item of productItems || []) {
        const product = products?.find((p) => p.id === item.product_id);
        if (product) {
          totalCost += product.purchase_price * item.quantity;
        }
      }

      const totalProfit = totalSales - totalTax - totalCost;

      setSalesData({
        totalSales,
        totalOrders,
        totalProfit,
        totalTax,
      });
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Metric', 'Value'];
    const data = [
      ['Period', `${dateFrom} to ${dateTo}`],
      ['Total Sales', `₹${salesData.totalSales.toFixed(2)}`],
      ['Total Orders', salesData.totalOrders.toString()],
      ['Total Profit', `₹${salesData.totalProfit.toFixed(2)}`],
      ['Total Tax', `₹${salesData.totalTax.toFixed(2)}`],
      [''],
      ['Top Products', ''],
      ['Product Name', 'Quantity Sold', 'Revenue'],
      ...topProducts.map((p) => [p.name, p.quantity.toString(), `₹${p.revenue.toFixed(2)}`]),
    ];

    const csv = [headers, ...data].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateFrom}-${dateTo}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-gray-600 mt-1">Track sales, profit, and inventory</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors active:scale-98 text-base w-full sm:w-auto"
        >
          <Download className="w-5 h-5" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Date Range</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Sales</p>
          <p className="text-3xl font-bold text-gray-800">₹{salesData.totalSales.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Profit</p>
          <p className="text-3xl font-bold text-green-600">₹{salesData.totalProfit.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-800">{salesData.totalOrders}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Tax</p>
          <p className="text-3xl font-bold text-gray-800">₹{salesData.totalTax.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Top Selling Products</h3>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No sales data available</p>
              </div>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-blue-600">₹{product.revenue.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center space-x-2 mb-6">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-800">Low Stock Products</h3>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>All products are well stocked</p>
              </div>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border border-amber-200 rounded-lg bg-amber-50"
                >
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{product.stock_qty} left</p>
                    <p className="text-xs text-gray-500">Min: {product.low_stock_threshold}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}