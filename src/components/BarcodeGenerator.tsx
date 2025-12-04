import { useState } from 'react';
import { X, Copy, Download, RefreshCw } from 'lucide-react';

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
      newBarcode = Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join('');
    } else if (barcodeType === 'UPC') {
      newBarcode = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      newBarcode = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    setBarcode(newBarcode);
    setDisplayBarcode(generateBarcodeImage(newBarcode, barcodeType));
  };

  const generateBarcodeImage = (code: string, type: string): string => {
    const barWidth = 3;
    const barHeight = 100;
    const width = code.length * barWidth * 8;
    const height = barHeight + 40;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${width}" height="${height}" fill="white"/>`;

    let xPos = 10;
    for (const digit of code) {
      const bits = getBarPattern(digit, type);
      for (const bit of bits) {
        if (bit === '1') {
          svg += `<rect x="${xPos}" y="10" width="${barWidth}" height="${barHeight}" fill="black"/>`;
        }
        xPos += barWidth;
      }
    }

    svg += `<text x="${width / 2}" y="${barHeight + 30}" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">${code}</text>`;
    svg += `</svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const getBarPattern = (digit: string, type: string): string => {
    const patterns: Record<string, Record<string, string>> = {
      CODE128: {
        '0': '11011001100',
        '1': '11001101100',
        '2': '11001100110',
        '3': '10010011000',
        '4': '10010001100',
        '5': '10001001100',
        '6': '10011001000',
        '7': '10011000100',
        '8': '10001100100',
        '9': '11010001100',
        A: '11001011000',
        B: '11001000110',
        C: '11000101110',
        D: '11000100100',
        E: '11000010100',
        F: '11000001010',
      },
      EAN13: {
        '0': '0001101',
        '1': '0011001',
        '2': '0010011',
        '3': '0111011',
        '4': '0100001',
        '5': '0110001',
        '6': '0101111',
        '7': '0111101',
        '8': '0110111',
        '9': '0001011',
      },
      UPC: {
        '0': '0001101',
        '1': '0011001',
        '2': '0010011',
        '3': '0111011',
        '4': '0100001',
        '5': '0110001',
        '6': '0101111',
        '7': '0111101',
        '8': '0110111',
        '9': '0001011',
      },
    };

    return patterns[type]?.[digit] || '00000000';
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(barcode);
    alert('Barcode copied to clipboard!');
  };

  const convertSvgToPng = async (svgDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = reject;
      img.src = svgDataUrl;
    });
  };

  const downloadBarcode = async () => {
    try {
      const pngDataUrl = await convertSvgToPng(displayBarcode);
      const link = document.createElement('a');
      link.href = pngDataUrl;
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
                    {type === 'EAN13' && ' (13 digits)'}
                    {type === 'UPC' && ' (12 digits)'}
                    {type === 'CODE128' && ' (alphanumeric)'}
                  </span>
                </label>
              ))}
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