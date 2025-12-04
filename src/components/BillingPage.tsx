import { useState, useEffect, useRef } from 'react';
import { supabase, type Product, type Service, type Customer } from '../lib/supabase';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Printer,
  Receipt,
  Scan,
  User,
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState<string | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [loading]);

  const loadData = async () => {
    try {
      const [productsResult, servicesResult, customersResult] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('services').select('*').eq('active', true).order('name'),
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
      ]);

      if (productsResult.error) throw productsResult.error;
      if (servicesResult.error) throw servicesResult.error;
      if (customersResult.error) throw customersResult.error;

      setProducts(productsResult.data || []);
      setServices(servicesResult.data || []);
      setCustomers(customersResult.data || []);
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
    const totalInclusive = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (totalInclusive * parseFloat(discountValue || '0')) / 100;
    } else {
      discountAmount = parseFloat(discountValue || '0');
    }

    const afterDiscount = totalInclusive - discountAmount;

    let subtotalExcludingTax = 0;
    let taxAmount = 0;

    cart.forEach((item) => {
      const itemTotalInclusive = item.price * item.quantity;
      const discountRatio = afterDiscount / totalInclusive;
      const itemAfterDiscount = itemTotalInclusive * discountRatio;

      const itemBasePrice = itemAfterDiscount / (1 + item.taxRate / 100);
      const itemTax = itemAfterDiscount - itemBasePrice;

      subtotalExcludingTax += itemBasePrice;
      taxAmount += itemTax;
    });

    return {
      subtotal: subtotalExcludingTax,
      discountAmount,
      discountPercentage: discountType === 'percentage' ? parseFloat(discountValue || '0') : 0,
      taxAmount,
      total: afterDiscount,
    };
  };

  const handleBarcodeSearch = () => {
    const product = products.find(
      (p) => p.barcode?.toLowerCase() === barcodeInput.toLowerCase()
    );
    if (product) {
      addToCart(product, 'product');
      setBarcodeInput('');
      setTimeout(() => barcodeInputRef.current?.focus(), 0);
    } else {
      alert('Product not found with this barcode');
      setTimeout(() => barcodeInputRef.current?.focus(), 0);
    }
  };

  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);

    if (value.length >= 3) {
      const matches = customers.filter(
        (c) => c.phone.includes(value) || c.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(matches);
      setShowCustomerSuggestions(matches.length > 0);
    } else {
      setFilteredCustomers([]);
      setShowCustomerSuggestions(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setSelectedCustomerId(customer.id);
    setShowCustomerSuggestions(false);
    setFilteredCustomers([]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setProcessing(true);

    try {
      const totals = calculateTotals();

      let customerId = selectedCustomerId;

      if (customerPhone && customerName && !customerId) {
        const existingCustomer = customers.find((c) => c.phone === customerPhone);

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert([
              {
                name: customerName,
                phone: customerPhone,
                email: '',
                address: '',
                notes: '',
              },
            ])
            .select()
            .single();

          if (customerError) {
            console.error('Error creating customer:', customerError);
          } else if (newCustomer) {
            customerId = newCustomer.id;
            setCustomers([...customers, newCustomer]);
          }
        }
      }

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
            customer_id: customerId,
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

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        throw new Error(invoiceError.message || 'Failed to create invoice');
      }

      const invoiceId = invoiceData[0].id;

      const invoiceItems = cart.map((item) => {
        const totalInclusive = item.price * item.quantity;
        const basePrice = totalInclusive / (1 + item.taxRate / 100);
        const taxAmount = totalInclusive - basePrice;

        return {
          invoice_id: invoiceId,
          item_type: item.type,
          product_id: item.productId || null,
          service_id: item.serviceId || null,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          tax_rate: item.taxRate,
          tax_amount: taxAmount,
          total_amount: totalInclusive,
        };
      });

      const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);

      if (itemsError) {
        console.error('Invoice items error:', itemsError);
        throw new Error(itemsError.message || 'Failed to add invoice items');
      }

      for (const item of cart) {
        if (item.type === 'product' && item.productId) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            const updateResult = await supabase
              .from('products')
              .update({
                stock_qty: product.stock_qty - item.quantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.productId);

            if (updateResult.error) {
              console.error('Stock update error:', updateResult.error);
            }

            const movementResult = await supabase.from('stock_movements').insert([
              {
                product_id: item.productId,
                movement_type: 'sale',
                quantity: -item.quantity,
                reference_id: invoiceId,
                notes: `Sale - Invoice ${invoiceNumber}`,
                created_at: new Date().toISOString(),
              },
            ]);

            if (movementResult.error) {
              console.error('Stock movement error:', movementResult.error);
            }
          }
        }
      }

      setLastInvoiceId(invoiceId);
      setShowPreview(true);

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setSelectedCustomerId(null);
      setDiscountValue('0');
      setSearchTerm('');

      loadData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error processing checkout. Please try again.';
      alert(errorMessage);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      <div className="lg:col-span-2 space-y-4 lg:space-y-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">New Invoice</h2>
          <p className="text-sm lg:text-base text-gray-600">Scan items or search to add to cart</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-700" />
            <h3 className="text-base lg:text-lg font-semibold text-gray-800">Customer Information</h3>
            <span className="text-xs text-gray-500 ml-auto">Optional</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
            <div className="relative">
              <input
                type="tel"
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onFocus={() => {
                  if (customerPhone.length >= 3 && filteredCustomers.length > 0) {
                    setShowCustomerSuggestions(true);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              {showCustomerSuggestions && filteredCustomers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                          {customer.email && (
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-4 lg:p-6 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Scan className="w-5 h-5 text-blue-600" />
            <h3 className="text-base lg:text-lg font-semibold text-gray-800">Quick Scan</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode here..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                className="w-full px-4 py-4 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium bg-white"
              />
            </div>
            <button
              onClick={handleBarcodeSearch}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm active:scale-95"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gray-700" />
            <h3 className="text-base lg:text-lg font-semibold text-gray-800">Browse Products & Services</h3>
          </div>

          <div className="relative mb-4">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {searchTerm ? (
              <>
                {filteredProducts.length === 0 && filteredServices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No products or services found</p>
                  </div>
                )}
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product, 'product')}
                    disabled={product.stock_qty === 0}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-base truncate">{product.name}</p>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-blue-600 text-base">₹{product.sale_price.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Stock: {product.stock_qty}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => addToCart(service, 'service')}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors active:scale-98"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-base truncate">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.duration} mins</p>
                      </div>
                      <p className="font-semibold text-blue-600 text-base flex-shrink-0">₹{service.price.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Start typing to search</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6 lg:sticky lg:top-6 border-t-4 border-blue-600">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">Cart</h3>
            </div>
            <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
              {cart.length}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto mb-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs text-gray-400 mt-1">Scan or search items to add</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={`${item.type}-${item.id}-${index}`} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors bg-gray-50">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.type === 'product' ? 'Product' : 'Service'} • ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-500 hover:bg-red-50 p-1.5 rounded flex-shrink-0 active:scale-95 transition-transform"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 active:scale-95 transition-transform"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-base font-bold w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 active:scale-95 transition-transform"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-bold text-gray-900 text-base">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <>
              <div className="border-t-2 border-gray-200 pt-4 space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Discount</label>
                  <div className="flex gap-2">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                      className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base font-medium"
                    >
                      <option value="percentage">%</option>
                      <option value="amount">₹</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="0"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="font-medium">Discount</span>
                    <span className="font-semibold">-₹{totals.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">₹{totals.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
                  <span className="text-gray-800">Total</span>
                  <span className="text-blue-600">₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-bold active:scale-98 shadow-md disabled:shadow-none"
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