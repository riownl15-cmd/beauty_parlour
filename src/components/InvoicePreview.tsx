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

  const handlePrint = async () => {
    let logoBase64 = '';

    try {
      const logoPath = '/asset_2smile_struct.png';
      const response = await fetch(logoPath);
      const blob = await response.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - ${invoice?.invoice_number || 'Invoice'}</title>
        <style>
          @page {
            size: 72mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 72mm;
            margin: 0;
            padding: 2mm;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.3;
            background: white;
            font-weight: normal;
          }
          .receipt {
            width: 100%;
          }
          .center {
            text-align: center;
          }
          .logo {
            width: 40mm;
            height: auto;
            margin: 0 auto 4px;
            display: block;
          }
          .separator {
            border-top: 1px dashed #000;
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
            padding: 2px 0;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            margin-bottom: 2px;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            padding-left: 2px;
            margin-top: 1px;
          }
          .uppercase {
            text-transform: uppercase;
          }
          h1 {
            font-size: 20px;
            margin: 3px 0;
            font-weight: bold;
          }
          h2 {
            font-size: 16px;
            margin: 3px 0;
            font-weight: bold;
          }
          .total-section {
            margin-top: 4px;
          }
          .total {
            font-size: 16px;
            font-weight: bold;
            padding: 2px 0;
          }
          p {
            margin: 2px 0;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center">
            ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Logo" />` : ''}
          </div>

          <div class="center">
            <h1>${settings.store_name.toUpperCase()}</h1>
            ${settings.store_address ? `<p>${settings.store_address}</p>` : ''}
            ${settings.store_phone ? `<p>Tel: ${settings.store_phone}</p>` : ''}
          </div>

          <div class="separator"></div>

          <div class="center">
            <h2>INVOICE</h2>
            <p>#${invoice?.invoice_number || ''}</p>
            <p>${invoice?.created_at ? formatDate(invoice.created_at) : ''}</p>
          </div>

          ${invoice?.customer_name || invoice?.customer_phone ? `
            <div class="separator"></div>
            <div>
              ${invoice.customer_name ? `<p>CUSTOMER: ${invoice.customer_name}</p>` : ''}
              ${invoice.customer_phone ? `<p>PHONE: ${invoice.customer_phone}</p>` : ''}
            </div>
          ` : ''}

          <div class="separator"></div>

          <div>
            ${items.map(item => `
              <div class="item">
                <div class="item-header">
                  <span>${item.item_name.toUpperCase()}</span>
                  <span>₹${item.total_amount.toFixed(2)}</span>
                </div>
                <div class="item-details">
                  <span>QTY: ${item.quantity}</span>
                  <span>@ ₹${item.unit_price.toFixed(2)}</span>
                  <span>TAX: ${item.tax_rate}%</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="separator"></div>

          <div class="total-section">
            <div class="flex">
              <span>SUBTOTAL:</span>
              <span>₹${invoice?.subtotal?.toFixed(2) || '0.00'}</span>
            </div>

            ${invoice?.discount_amount > 0 ? `
              <div class="flex">
                <span>DISCOUNT${invoice.discount_percentage > 0 ? ` (${invoice.discount_percentage}%)` : ''}:</span>
                <span>-₹${invoice.discount_amount.toFixed(2)}</span>
              </div>
            ` : ''}

            <div class="flex">
              <span>TAX:</span>
              <span>₹${invoice?.tax_amount?.toFixed(2) || '0.00'}</span>
            </div>

            <div class="separator-thick"></div>

            <div class="flex total">
              <span>TOTAL:</span>
              <span>₹${invoice?.total_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div class="separator"></div>

          <div class="center">
            <p>PAYMENT METHOD:</p>
            <h2>${invoice?.payment_method?.toUpperCase() || 'CASH'}</h2>
          </div>

          <div class="separator"></div>

          <div class="center">
            <p>THANK YOU FOR YOUR VISIT!</p>
            <p>PLEASE VISIT AGAIN</p>
          </div>
        </div>

        <div style="position: fixed; top: 10px; right: 10px; z-index: 9999; display: flex; gap: 10px;">
          <button onclick="window.print()" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;">
            🖨️ Print Receipt
          </button>
          <button onclick="window.close()" style="background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;">
            ✕ Close
          </button>
        </div>
        <style>
          @media print {
            button { display: none !important; }
          }
        </style>
        <script>
          (function() {
            var imagesLoaded = 0;
            var totalImages = document.images.length;
            var printTriggered = false;

            function tryPrint() {
              if (!printTriggered) {
                printTriggered = true;
                setTimeout(function() {
                  window.print();
                }, 800);
              }
            }

            if (totalImages === 0) {
              tryPrint();
            } else {
              for (var i = 0; i < totalImages; i++) {
                var img = document.images[i];
                if (img.complete) {
                  imageLoaded();
                } else {
                  img.addEventListener('load', imageLoaded);
                  img.addEventListener('error', imageLoaded);
                }
              }
            }

            function imageLoaded() {
              imagesLoaded++;
              if (imagesLoaded === totalImages) {
                tryPrint();
              }
            }

            window.addEventListener('load', function() {
              if (!printTriggered && imagesLoaded === totalImages) {
                tryPrint();
              }
            });
          })();
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

    const printWindow = window.open(blobUrl, '_blank');

    if (!printWindow) {
      URL.revokeObjectURL(blobUrl);
      alert('Failed to open print window. Please allow popups for this site and try again.');
      return;
    }

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
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
            <div className="thermal-receipt bg-white mx-auto" style={{ width: '76mm', padding: '5mm', fontFamily: 'monospace' }}>
              <div className="text-center mb-3">
                <img
                  src="/asset_2smile_struct.png"
                  alt="Store Logo"
                  className="w-32 h-auto mx-auto"
                />
              </div>

              <div className="text-center mb-3">
                <h1 className="text-xl font-bold mb-2">{settings.store_name.toUpperCase()}</h1>
                {settings.store_address && (
                  <p className="text-xs font-bold mb-1">{settings.store_address}</p>
                )}
                {settings.store_phone && (
                  <p className="text-xs font-bold mb-1">Tel: {settings.store_phone}</p>
                )}
              </div>

              <div className="border-t-2 border-dashed border-gray-600 my-3"></div>

              <div className="text-center text-sm mb-3">
                <p className="font-bold text-base">INVOICE</p>
                <p className="text-sm font-bold">#{invoice.invoice_number}</p>
                <p className="text-xs font-bold">{formatDate(invoice.created_at)}</p>
              </div>

              {(invoice.customer_name || invoice.customer_phone) && (
                <>
                  <div className="border-t-2 border-dashed border-gray-600 my-3"></div>
                  <div className="text-xs mb-3">
                    {invoice.customer_name && (
                      <p className="font-bold">CUSTOMER: {invoice.customer_name}</p>
                    )}
                    {invoice.customer_phone && (
                      <p className="font-bold">PHONE: {invoice.customer_phone}</p>
                    )}
                  </div>
                </>
              )}

              <div className="border-t-2 border-dashed border-gray-600 my-3"></div>

              <div className="text-xs space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="mb-3">
                    <div className="flex justify-between font-bold text-sm">
                      <span className="flex-1">{item.item_name.toUpperCase()}</span>
                      <span className="ml-2">₹{item.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold mt-1 ml-2">
                      <span>QTY: {item.quantity}</span>
                      <span>@ ₹{item.unit_price.toFixed(2)}</span>
                      <span>TAX: {item.tax_rate}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-600 my-3"></div>

              <div className="text-xs space-y-2">
                <div className="flex justify-between font-bold">
                  <span>SUBTOTAL:</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>

                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>
                      DISCOUNT{invoice.discount_percentage > 0 && ` (${invoice.discount_percentage}%)`}:
                    </span>
                    <span>-₹{invoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold">
                  <span>TAX:</span>
                  <span>₹{invoice.tax_amount.toFixed(2)}</span>
                </div>

                <div className="border-t-2 border-gray-800 my-2 pt-2"></div>

                <div className="flex justify-between font-bold text-base">
                  <span>TOTAL:</span>
                  <span>₹{invoice.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-gray-600 my-3"></div>

              <div className="text-xs text-center mb-3">
                <p className="font-bold">PAYMENT METHOD:</p>
                <p className="uppercase font-bold text-base mt-1">{invoice.payment_method}</p>
              </div>

              <div className="border-t-2 border-dashed border-gray-600 my-3"></div>

              <div className="text-center text-xs">
                <p className="font-bold">THANK YOU FOR YOUR VISIT!</p>
                <p className="font-bold">PLEASE VISIT AGAIN</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
