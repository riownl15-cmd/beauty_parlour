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
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - ${invoice.invoice_number}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 80mm;
            margin: 0;
            padding: 4mm;
            font-family: monospace;
            font-size: 10px;
            line-height: 1.3;
            background: white;
          }
          .receipt {
            width: 100%;
          }
          .center {
            text-align: center;
          }
          .bold {
            font-weight: bold;
          }
          .separator {
            border-top: 1px dashed #666;
            margin: 4px 0;
          }
          .separator-thick {
            border-top: 2px solid #000;
            margin: 4px 0;
          }
          .flex {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .item {
            margin-bottom: 6px;
          }
          .uppercase {
            text-transform: uppercase;
          }
          .gray {
            color: #666;
          }
          h1 {
            font-size: 16px;
            margin-bottom: 4px;
          }
          .total {
            font-size: 12px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center">
            <h1 class="bold">${settings.store_name}</h1>
            ${settings.store_address ? `<p>${settings.store_address}</p>` : ''}
            ${settings.store_phone ? `<p>Tel: ${settings.store_phone}</p>` : ''}
          </div>

          <div class="separator"></div>

          <div class="center">
            <p class="bold">INVOICE</p>
            <p>#${invoice.invoice_number}</p>
            <p>${formatDate(invoice.created_at)}</p>
          </div>

          ${invoice.customer_name || invoice.customer_phone ? `
            <div class="separator"></div>
            <div>
              ${invoice.customer_name ? `<p><strong>Customer:</strong> ${invoice.customer_name}</p>` : ''}
              ${invoice.customer_phone ? `<p><strong>Phone:</strong> ${invoice.customer_phone}</p>` : ''}
            </div>
          ` : ''}

          <div class="separator"></div>

          <div>
            ${items.map(item => `
              <div class="item">
                <div class="flex bold">
                  <span>${item.item_name}</span>
                  <span>₹${item.total_amount.toFixed(2)}</span>
                </div>
                <div class="gray" style="padding-left: 8px;">
                  <span>${item.quantity} x ₹${item.unit_price.toFixed(2)} (${item.tax_rate}% tax)</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="separator"></div>

          <div>
            <div class="flex">
              <span>Subtotal:</span>
              <span>₹${invoice.subtotal.toFixed(2)}</span>
            </div>

            ${invoice.discount_amount > 0 ? `
              <div class="flex">
                <span>Discount${invoice.discount_percentage > 0 ? ` (${invoice.discount_percentage}%)` : ''}:</span>
                <span>-₹${invoice.discount_amount.toFixed(2)}</span>
              </div>
            ` : ''}

            <div class="flex">
              <span>Tax:</span>
              <span>₹${invoice.tax_amount.toFixed(2)}</span>
            </div>

            <div class="separator-thick"></div>

            <div class="flex total">
              <span>TOTAL:</span>
              <span>₹${invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div class="separator"></div>

          <div class="center">
            <p><strong>Payment Method:</strong></p>
            <p class="uppercase">${invoice.payment_method}</p>
          </div>

          <div class="separator"></div>

          <div class="center">
            <p class="bold">Thank you for your visit!</p>
            <p>Please visit again</p>
          </div>
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
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
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
    </>
  );
}
