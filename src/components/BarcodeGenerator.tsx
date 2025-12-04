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
      newBarcode = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
      newBarcode = newBarcode + calculateEAN13Checksum(newBarcode);
    } else if (barcodeType === 'UPC') {
      newBarcode = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
      newBarcode = newBarcode + calculateUPCChecksum(newBarcode);
    } else {
      newBarcode = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    }

    setBarcode(newBarcode);
    setDisplayBarcode(generateBarcodeImage(newBarcode, barcodeType));
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

  const generateBarcodeImage = (code: string, type: string): string => {
    const barWidth = 3;
    const barHeight = 100;
    const quietZone = 50;

    const binaryString = encodeToCODE128(code);
    const totalWidth = (binaryString.length * barWidth) + (quietZone * 2);
    const totalHeight = barHeight + 70;

    let svg = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">`;
    svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;

    let xPos = quietZone;
    for (let i = 0; i < binaryString.length; i++) {
      if (binaryString[i] === '1') {
        svg += `<rect x="${xPos}" y="25" width="${barWidth}" height="${barHeight}" fill="black"/>`;
      }
      xPos += barWidth;
    }

    svg += `<text x="${totalWidth / 2}" y="${barHeight + 55}" font-size="18" font-family="monospace" text-anchor="middle" font-weight="600">${code}</text>`;
    svg += `</svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const encodeToCODE128 = (data: string): string => {
    const CODE128_PATTERNS = [
      '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
      '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
      '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
      '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
      '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
      '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
      '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
      '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
      '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
      '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
      '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
      '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
      '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
      '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
      '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
      '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
      '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
      '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
      '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
      '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
      '10111101110', '11101011110', '11110101110', '11010000100', '11010010000',
      '11010011100', '1100011101011'
    ];

    const CODE128_B_CHARS = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

    const START_B = 104;
    const STOP = 106;

    const isNumericOnly = /^\d+$/.test(data);
    const isEvenLength = data.length % 2 === 0;

    if (isNumericOnly && data.length >= 4 && isEvenLength) {
      return encodeToCODE128C(data);
    }

    let encoded = CODE128_PATTERNS[START_B];
    let checksum = START_B;

    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      const charIndex = CODE128_B_CHARS.indexOf(char);

      if (charIndex === -1) {
        console.warn(`Character "${char}" not supported in CODE128-B`);
        continue;
      }

      const codeValue = charIndex;
      encoded += CODE128_PATTERNS[codeValue];
      checksum += codeValue * (i + 1);
    }

    const checksumValue = checksum % 103;
    encoded += CODE128_PATTERNS[checksumValue];
    encoded += CODE128_PATTERNS[STOP];

    return encoded;
  };

  const encodeToCODE128C = (data: string): string => {
    const CODE128_PATTERNS = [
      '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
      '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
      '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
      '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
      '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
      '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
      '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
      '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
      '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
      '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
      '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
      '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
      '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
      '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
      '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
      '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
      '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
      '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
      '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
      '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
      '10111101110', '11101011110', '11110101110', '11010000100', '11010010000',
      '11010011100', '1100011101011'
    ];

    const START_C = 105;
    const STOP = 106;

    let encoded = CODE128_PATTERNS[START_C];
    let checksum = START_C;

    for (let i = 0; i < data.length; i += 2) {
      const pair = data.substr(i, 2);
      const value = parseInt(pair, 10);

      encoded += CODE128_PATTERNS[value];
      checksum += value * ((i / 2) + 1);
    }

    const checksumValue = checksum % 103;
    encoded += CODE128_PATTERNS[checksumValue];
    encoded += CODE128_PATTERNS[STOP];

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
        const scale = 3;
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png', 1.0));
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