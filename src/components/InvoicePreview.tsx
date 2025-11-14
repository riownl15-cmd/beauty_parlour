import { useState, useEffect } from 'react';
import { supabase, type Invoice, type InvoiceItem } from '../lib/supabase';
import { X, Printer } from 'lucide-react';

type InvoicePreviewProps = {
  invoiceId: string;
  onClose: () => void;
};

type StoreSettings = {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_logo: string;
};

export default function InvoicePreview({ invoiceId, onClose }: InvoicePreviewProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'Beauty Parlour',
    store_address: '',
    store_phone: '',
    store_logo: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      const [invoiceResult, itemsResult, settingsResult] = await Promise.all([
        supabase.from('invoices').select('*').eq('id', invoiceId).maybeSingle(),
        supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId),
        supabase
          .from('settings')
          .select('*')
          .in('key', ['store_name', 'store_address', 'store_phone', 'store_logo']),
      ]);

      if (invoiceResult.error) throw invoiceResult.error;
      if (itemsResult.error) throw itemsResult.error;

      setInvoice(invoiceResult.data);
      setItems(itemsResult.data || []);

      if (settingsResult.data) {
        const settingsMap = settingsResult.data.reduce((acc, s) => {
          acc[s.key] = s.value;
          return acc;
        }, {} as Record<string, string>);

        setSettings({
          store_name: settingsMap.store_name || 'Beauty Parlour',
          store_address: settingsMap.store_address || '',
          store_phone: settingsMap.store_phone || '',
          store_logo: settingsMap.store_logo || '',
        });
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !invoice) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">Loading...</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 print:hidden">
          <h3 className="text-2xl font-bold text-gray-800">Invoice Preview</h3>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 print:p-12" id="invoice-content">
          <div className="border-2 border-gray-300 p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{settings.store_name}</h1>
                {settings.store_address && (
                  <p className="text-gray-600">{settings.store_address}</p>
                )}
                {settings.store_phone && <p className="text-gray-600">{settings.store_phone}</p>}
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-blue-600 mb-2">INVOICE</h2>
                <p className="text-gray-600">#{invoice.invoice_number}</p>
                <p className="text-sm text-gray-500">{formatDate(invoice.created_at)}</p>
              </div>
            </div>

            {(invoice.customer_name || invoice.customer_phone) && (
              <div className="mb-8 pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">BILL TO:</h3>
                {invoice.customer_name && (
                  <p className="text-gray-800 font-medium">{invoice.customer_name}</p>
                )}
                {invoice.customer_phone && <p className="text-gray-600">{invoice.customer_phone}</p>}
              </div>
            )}

            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    ITEM
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">TYPE</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">QTY</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                    PRICE
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">TAX</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3 px-2 text-gray-800">{item.item_name}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          item.item_type === 'product'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {item.item_type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-800">{item.quantity}</td>
                    <td className="py-3 px-2 text-right text-gray-800">
                      ₹{item.unit_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-600 text-sm">
                      {item.tax_rate}%
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-gray-800">
                      ₹{item.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-800">₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
                    <span>
                      Discount
                      {invoice.discount_percentage > 0 && ` (${invoice.discount_percentage}%)`}
                    </span>
                    <span>-₹{invoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-800">₹{invoice.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-800">TOTAL</span>
                  <span className="text-xl font-bold text-blue-600">
                    ₹{invoice.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end text-sm text-gray-600 pt-4 border-t border-gray-200">
              <div>
                <p className="font-medium mb-1">Payment Method:</p>
                <p className="uppercase">{invoice.payment_method}</p>
              </div>
              <div className="text-right">
                <p>Thank you for your business!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}