import { useState, useEffect } from 'react';
import { supabase, type Product, type Service } from '../lib/supabase';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Printer,
  Receipt,
  Scan,
} from 'lucide-react';
import InvoicePreview from './InvoicePreview';

type CartItem = {
  id: string;
  type: 'product' | 'service';
  name: string;
  price: number;
  taxRate: number;
  quantity: number;
  stock?: number;
  productId?: string;
  serviceId?: string;
};

export default function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsResult, servicesResult] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('services').select('*').eq('active', true).order('name'),
      ]);

      if (productsResult.error) throw productsResult.error;
      if (servicesResult.error) throw servicesResult.error;

      setProducts(productsResult.data || []);
      setServices(servicesResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: Product | Service, type: 'product' | 'service') => {
    const existingItemIndex = cart.findIndex(
      (cartItem) =>
        cartItem.id === item.id && cartItem.type === type
    );

    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      if (type === 'product') {
        const product = item as Product;
        if (newCart[existingItemIndex].quantity < product.stock_qty) {
          newCart[existingItemIndex].quantity += 1;
        } else {
          alert('Not enough stock available');
          return;
        }
      } else {
        newCart[existingItemIndex].quantity += 1;
      }
      setCart(newCart);
    } else {
      const newItem: CartItem = {
        id: item.id,
        type,
        name: item.name,
        price: type === 'product' ? (item as Product).sale_price : (item as Service).price,
        taxRate: type === 'product' ? (item as Product).tax_rate : (item as Service).tax_rate,
        quantity: 1,
        ...(type === 'product' && {
          stock: (item as Product).stock_qty,
          productId: item.id,
        }),
        ...(type === 'service' && {
          serviceId: item.id,
        }),
      };
      setCart([...cart, newItem]);
    }
    setSearchTerm('');
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQuantity = newCart[index].quantity + delta;

    if (newQuantity <= 0) {
      newCart.splice(index, 1);
    } else if (newCart[index].type === 'product' && newCart[index].stock) {
      if (newQuantity <= newCart[index].stock!) {
        newCart[index].quantity = newQuantity;
      } else {
        alert('Not enough stock available');
        return;
      }
    } else {
      newCart[index].quantity = newQuantity;
    }

    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * parseFloat(discountValue || '0')) / 100;
    } else {
      discountAmount = parseFloat(discountValue || '0');
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = cart.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      return sum + (itemTotal * item.taxRate) / 100;
    }, 0);

    const total = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      discountPercentage: discountType === 'percentage' ? parseFloat(discountValue || '0') : 0,
      taxAmount,
      total,
    };
  };

  const handleBarcodeSearch = () => {
    const product = products.find(
      (p) => p.barcode?.toLowerCase() === barcodeInput.toLowerCase()
    );
    if (product) {
      addToCart(product, 'product');
      setBarcodeInput('');
    } else {
      alert('Product not found with this barcode');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setProcessing(true);

    try {
      const totals = calculateTotals();

      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['invoice_prefix', 'invoice_counter']);

      const settings = settingsData?.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as Record<string, string>);

      const prefix = settings?.invoice_prefix || 'INV';
      const counter = parseInt(settings?.invoice_counter || '1000') + 1;
      const invoiceNumber = `${prefix}-${counter}`;

      await supabase
        .from('settings')
        .update({ value: counter.toString() })
        .eq('key', 'invoice_counter');

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            invoice_number: invoiceNumber,
            customer_name: customerName,
            customer_phone: customerPhone,
            subtotal: totals.subtotal,
            discount_amount: totals.discountAmount,
            discount_percentage: totals.discountPercentage,
            tax_amount: totals.taxAmount,
            total_amount: totals.total,
            payment_method: paymentMethod,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (invoiceError) throw invoiceError;

      const invoiceId = invoiceData[0].id;

      const invoiceItems = cart.map((item) => ({
        invoice_id: invoiceId,
        item_type: item.type,
        product_id: item.productId || null,
        service_id: item.serviceId || null,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        tax_rate: item.taxRate,
        tax_amount: (item.price * item.quantity * item.taxRate) / 100,
        total_amount: item.price * item.quantity + (item.price * item.quantity * item.taxRate) / 100,
      }));

      const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);

      if (itemsError) throw itemsError;

      for (const item of cart) {
        if (item.type === 'product' && item.productId) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            await supabase
              .from('products')
              .update({
                stock_qty: product.stock_qty - item.quantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.productId);

            await supabase.from('stock_movements').insert([
              {
                product_id: item.productId,
                movement_type: 'sale',
                quantity: -item.quantity,
                reference_id: invoiceId,
                notes: `Sale - Invoice ${invoiceNumber}`,
                created_at: new Date().toISOString(),
              },
            ]);
          }
        }
      }

      setLastInvoiceId(invoiceId);
      setShowPreview(true);

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountValue('0');
      setSearchTerm('');

      loadData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error processing checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = calculateTotals();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Billing</h2>
          <p className="text-gray-600">Create new invoice</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Barcode Scanner</h3>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Scan className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Scan or enter barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleBarcodeSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Products & Services</h3>
          <div className="relative mb-4">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products or services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {searchTerm && (
              <>
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product, 'product')}
                    disabled={product.stock_qty === 0}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">₹{product.sale_price.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Stock: {product.stock_qty}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => addToCart(service, 'service')}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.duration} mins</p>
                      </div>
                      <p className="font-semibold text-blue-600">₹{service.price.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
          <div className="flex items-center space-x-2 mb-6">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">Cart ({cart.length})</h3>
          </div>

          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="tel"
              placeholder="Phone Number (Optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={`${item.type}-${item.id}-${index}`} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.type === 'product' ? 'Product' : 'Service'}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-semibold text-gray-800">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
              <div className="flex space-x-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">%</option>
                  <option value="amount">₹</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-₹{totals.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">₹{totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-blue-600">₹{totals.total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Printer className="w-5 h-5" />
            <span>{processing ? 'Processing...' : 'Checkout & Print'}</span>
          </button>
        </div>
      </div>

      {showPreview && lastInvoiceId && (
        <InvoicePreview
          invoiceId={lastInvoiceId}
          onClose={() => {
            setShowPreview(false);
            setLastInvoiceId(null);
          }}
        />
      )}
    </div>
  );
}