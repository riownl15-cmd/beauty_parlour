import { useState } from 'react';
import { X, Copy, Download, RefreshCw } from 'lucide-react';
import JsBarcode from 'jsbarcode';

type BarcodeGeneratorProps = {
  productName: string;
  onBarcodeGenerated: (barcode: string) => void;
  onClose: () => void;
};

export default function BarcodeGenerator({
  productName,
  onBarcodeGenerated,
  onClose,
}: BarcodeGeneratorProps) {
  const [barcodeType, setBarcodeType] = useState<'CODE128' | 'EAN13' | 'UPC'>('CODE128');
  const [barcode, setBarcode] = useState('');
  const [displayBarcode, setDisplayBarcode] = useState('');

  const generateBarcode = () => {
    let newBarcode = '';

    if (barcodeType === 'EAN13') {
      newBarcode = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
      newBarcode = newBarcode + calculateEAN13Checksum(newBarcode);
    } else if (barcodeType === 'UPC') {
      newBarcode = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
      newBarcode = newBarcode + calculateUPCChecksum(newBarcode);
    } else {
      newBarcode = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    }

    setBarcode(newBarcode);
    generateBarcodeImage(newBarcode, barcodeType);
  };

  const calculateEAN13Checksum = (code: string): string => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    return checksum.toString();
  };

  const calculateUPCChecksum = (code: string): string => {
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      const digit = parseInt(code[i], 10);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    const checksum = (10 - (sum % 10)) % 10;
    return checksum.toString();
  };

  const generateBarcodeImage = (code: string, type: string): void => {
    try {
      const canvas = document.createElement('canvas');

      const formatMap: Record<string, string> = {
        'CODE128': 'CODE128',
        'EAN13': 'EAN13',
        'UPC': 'UPC'
      };

      JsBarcode(canvas, code, {
        format: formatMap[type],
        width: 3,
        height: 100,
        displayValue: true,
        fontSize: 18,
        fontOptions: 'bold',
        margin: 15,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const dataUrl = canvas.toDataURL('image/png');
      setDisplayBarcode(dataUrl);
    } catch (error) {
      console.error('Error generating barcode:', error);
      alert('Failed to generate barcode. Please try again.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(barcode);
    alert('Barcode copied to clipboard!');
  };

  const downloadBarcode = () => {
    try {
      const link = document.createElement('a');
      link.href = displayBarcode;
      link.download = `barcode-${barcode}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading barcode:', error);
      alert('Failed to download barcode');
    }
  };

  const useThisBarcode = () => {
    onBarcodeGenerated(barcode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Barcode Generator</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product: {productName}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode Type
            </label>
            <div className="space-y-2">
              {(['CODE128', 'EAN13', 'UPC'] as const).map((type) => (
                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="barcodeType"
                    value={type}
                    checked={barcodeType === type}
                    onChange={(e) => setBarcodeType(e.target.value as typeof barcodeType)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    {type}
                    {type === 'EAN13' && ' (13 digits) - Retail Standard'}
                    {type === 'UPC' && ' (12 digits) - US/Canada Retail'}
                    {type === 'CODE128' && ' (Recommended for Inventory)'}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>Tip:</strong> CODE128 automatically uses optimal encoding. Numeric-only barcodes use CODE128-C for better scanning reliability.
              </p>
            </div>
          </div>

          <button
            onClick={generateBarcode}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Generate Barcode</span>
          </button>

          {barcode && displayBarcode && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <img src={displayBarcode} alt="Generated Barcode" className="w-full" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900 font-mono break-all">{barcode}</p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center space-x-1 bg-gray-200 text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={downloadBarcode}
                  className="flex-1 flex items-center justify-center space-x-1 bg-gray-200 text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>

              <button
                onClick={useThisBarcode}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Use This Barcode
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}