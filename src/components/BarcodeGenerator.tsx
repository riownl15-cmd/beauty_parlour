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
    const barWidth = 4;
    const barHeight = 120;
    const quietZone = 40;

    const binaryString = encodeToCODE128(code);
    const totalWidth = (binaryString.length * barWidth) + (quietZone * 2);
    const totalHeight = barHeight + 60;

    let svg = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;

    let xPos = quietZone;
    for (let i = 0; i < binaryString.length; i++) {
      if (binaryString[i] === '1') {
        svg += `<rect x="${xPos}" y="20" width="${barWidth}" height="${barHeight}" fill="black"/>`;
      }
      xPos += barWidth;
    }

    svg += `<text x="${totalWidth / 2}" y="${barHeight + 45}" font-size="16" font-family="Arial, sans-serif" text-anchor="middle" font-weight="bold">${code}</text>`;
    svg += `</svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const encodeToCODE128 = (data: string): string => {
    const CODE128_B: Record<string, string> = {
      '0': '11011001100', '1': '11001101100', '2': '11001100110', '3': '10010011000',
      '4': '10010001100', '5': '10001001100', '6': '10011001000', '7': '10011000100',
      '8': '10001100100', '9': '11001001100', 'A': '11001000110', 'B': '10110011000',
      'C': '10011011000', 'D': '10011000110', 'E': '10110001100', 'F': '10001101100',
      'G': '10001100110', 'H': '11001100100', 'I': '11000110100', 'J': '11000100110',
      'K': '10110011100', 'L': '10011011100', 'M': '10011001110', 'N': '10111001100',
      'O': '10011101100', 'P': '10011100110', 'Q': '11001110010', 'R': '11001011100',
      'S': '11001001110', 'T': '11011100100', 'U': '11001110100', 'V': '11101101110',
      'W': '11101001100', 'X': '11100101100', 'Y': '11100100110', 'Z': '11101100100',
      ' ': '11100110100', '!': '11100110010', '"': '11011011000', '#': '11011000110',
      '$': '11000110110', '%': '10100011000', '&': '10001011000', "'": '10001000110',
      '(': '10110001000', ')': '10001101000', '*': '10001100010', '+': '11010001000',
      ',': '11000101000', '-': '11000100010', '.': '10110111000', '/': '10110001110',
    };

    const START_B = '11010010000';
    const STOP = '1100011101011';

    let encoded = START_B;
    let checksum = 104;

    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      const pattern = CODE128_B[char];
      if (pattern) {
        encoded += pattern;
        const charValue = char.charCodeAt(0) - 32;
        checksum += charValue * (i + 1);
      }
    }

    const checksumValue = checksum % 103;
    const checksumChar = String.fromCharCode(checksumValue + 32);
    const checksumPattern = CODE128_B[checksumChar] || '11011001100';
    encoded += checksumPattern;
    encoded += STOP;

    return encoded;
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