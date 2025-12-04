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
    <>
      <style>
        {`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 80mm;
              height: auto;
            }
            body > *:not(.print-container) {
              display: none !important;
            }
            .print-container {
              display: block !important;
              width: 80mm !important;
              page-break-after: avoid !important;
            }
            .thermal-receipt {
              width: 76mm !important;
              margin: 0 auto !important;
              padding: 4mm !important;
              font-size: 9pt !important;
              line-height: 1.3 !important;
              background: white !important;
              color: black !important;
              page-break-inside: avoid !important;
            }
          }
          .print-container {
            display: none;
          }
        `}
      </style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto no-print">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">Receipt Preview</h3>
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

          <div className="p-4 bg-gray-50">
            <div className="thermal-receipt bg-white mx-auto" style={{ width: '76mm', padding: '4mm', fontFamily: 'monospace' }}>
              <div className="text-center mb-3">
                <h1 className="text-xl font-bold mb-1">{settings.store_name}</h1>
                {settings.store_address && (
                  <p className="text-xs mb-1">{settings.store_address}</p>
                )}
                {settings.store_phone && (
                  <p className="text-xs mb-1">Tel: {settings.store_phone}</p>
                )}
              </div>

              <div className="border-t-2 border-dashed border-gray-400 my-2"></div>

              <div className="text-center text-sm mb-2">
                <p className="font-bold">INVOICE</p>
                <p className="text-xs">#{invoice.invoice_number}</p>
                <p className="text-xs">{formatDate(invoice.created_at)}</p>
              </div>

              {(invoice.customer_name || invoice.customer_phone) && (
                <>
                  <div className="border-t border-dashed border-gray-400 my-2"></div>
                  <div className="text-xs mb-2">
                    {invoice.customer_name && (
                      <p><strong>Customer:</strong> {invoice.customer_name}</p>
                    )}
                    {invoice.customer_phone && (
                      <p><strong>Phone:</strong> {invoice.customer_phone}</p>
                    )}
                  </div>
                </>
              )}

              <div className="border-t-2 border-dashed border-gray-400 my-2"></div>

              <div className="text-xs">
                {items.map((item, index) => (
                  <div key={item.id} className="mb-2">
                    <div className="flex justify-between font-semibold">
                      <span>{item.item_name}</span>
                      <span>₹{item.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 ml-2">
                      <span>{item.quantity} x ₹{item.unit_price.toFixed(2)} ({item.tax_rate}% tax)</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-400 my-2"></div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>

                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span>
                      Discount{invoice.discount_percentage > 0 && ` (${invoice.discount_percentage}%)`}:
                    </span>
                    <span>-₹{invoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>₹{invoice.tax_amount.toFixed(2)}</span>
                </div>

                <div className="border-t-2 border-gray-800 my-1 pt-1"></div>

                <div className="flex justify-between font-bold text-base">
                  <span>TOTAL:</span>
                  <span>₹{invoice.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-gray-400 my-2"></div>

              <div className="text-xs text-center mb-2">
                <p><strong>Payment Method:</strong></p>
                <p className="uppercase">{invoice.payment_method}</p>
              </div>

              <div className="border-t border-dashed border-gray-400 my-2"></div>

              <div className="text-center text-xs">
                <p className="font-semibold">Thank you for your visit!</p>
                <p>Please visit again</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="print-container">
        <div className="thermal-receipt" style={{ fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{settings.store_name}</h1>
            {settings.store_address && (
              <p style={{ fontSize: '10px', margin: '0' }}>{settings.store_address}</p>
            )}
            {settings.store_phone && (
              <p style={{ fontSize: '10px', margin: '0' }}>Tel: {settings.store_phone}</p>
            )}
          </div>

          <div style={{ borderTop: '1px dashed #666', margin: '4px 0' }}></div>

          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <p style={{ fontWeight: 'bold', margin: '0' }}>INVOICE</p>
            <p style={{ fontSize: '10px', margin: '0' }}>#{invoice.invoice_number}</p>
            <p style={{ fontSize: '10px', margin: '0' }}>{formatDate(invoice.created_at)}</p>
          </div>

          {(invoice.customer_name || invoice.customer_phone) && (
            <>
              <div style={{ borderTop: '1px dashed #666', margin: '4px 0' }}></div>
              <div style={{ fontSize: '10px', marginBottom: '6px' }}>
                {invoice.customer_name && (
                  <p style={{ margin: '0' }}><strong>Customer:</strong> {invoice.customer_name}</p>
                )}
                {invoice.customer_phone && (
                  <p style={{ margin: '0' }}><strong>Phone:</strong> {invoice.customer_phone}</p>
                )}
              </div>
            </>
          )}

          <div style={{ borderTop: '1px dashed #666', margin: '4px 0' }}></div>

          <div style={{ fontSize: '10px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                  <span>{item.item_name}</span>
                  <span>₹{item.total_amount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', paddingLeft: '8px' }}>
                  <span>{item.quantity} x ₹{item.unit_price.toFixed(2)} ({item.tax_rate}% tax)</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #666', margin: '4px 0' }}></div>

          <div style={{ fontSize: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>

            {invoice.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span>
                  Discount{invoice.discount_percentage > 0 && ` (${invoice.discount_percentage}%)`}:
                </span>
                <span>-₹{invoice.discount_amount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>Tax:</span>
              <span>₹{invoice.tax_amount.toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '2px solid #000', margin: '4px 0', paddingTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px' }}>
                <span>TOTAL:</span>
                <span>₹{invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #666', margin: '4px 0' }}></div>

          <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '6px' }}>
            <p style={{ margin: '0' }}><strong>Payment Method:</strong></p>
            <p style={{ margin: '0', textTransform: 'uppercase' }}>{invoice.payment_method}</p>
          </div>

          <div style={{ borderTop: '1px dashed #666', margin: '4px 0' }}></div>

          <div style={{ textAlign: 'center', fontSize: '10px' }}>
            <p style={{ fontWeight: '600', margin: '0' }}>Thank you for your visit!</p>
            <p style={{ margin: '0' }}>Please visit again</p>
          </div>
        </div>
      </div>
    </>
  );
}
