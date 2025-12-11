import QRCode from 'qrcode';
import { Sale } from '../types';

export interface PrinterConfig {
    paperWidth: '58mm' | '80mm';
    showLogo: boolean;
    showQRCode: boolean;
    fontSize: 'small' | 'normal' | 'large';
    autoCut: boolean;
    storeName: string;
    storeAddress: string;
    storePhone: string;
    storeCNPJ: string;
}

// Default config
const defaultConfig: PrinterConfig = {
    paperWidth: '80mm',
    showLogo: true,
    showQRCode: true,
    fontSize: 'normal',
    autoCut: true,
    storeName: 'GESTOR PRO',
    storeAddress: 'Rua Exemplo, 123 - Centro',
    storePhone: '(11) 98765-4321',
    storeCNPJ: '00.000.000/0001-00',
};

export class ThermalPrintService {
    private static config: PrinterConfig = defaultConfig;

    // Load config from localStorage
    static loadConfig(): PrinterConfig {
        const saved = localStorage.getItem('printer-config');
        if (saved) {
            this.config = { ...defaultConfig, ...JSON.parse(saved) };
        }
        return this.config;
    }

    // Save config to localStorage
    static saveConfig(config: Partial<PrinterConfig>) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('printer-config', JSON.stringify(this.config));
    }

    // Get current config
    static getConfig(): PrinterConfig {
        return this.config;
    }

    // Generate QR Code as data URL
    static async generateQRCode(text: string): Promise<string> {
        try {
            return await QRCode.toDataURL(text, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
            return '';
        }
    }

    // Format sale data for thermal receipt
    static formatReceiptData(sale: Sale) {
        const date = new Date(sale.date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        const formattedTime = date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        return {
            ...sale,
            formattedDate,
            formattedTime,
        };
    }

    // Generate receipt HTML for thermal printer
    static async generateThermalReceipt(sale: Sale): Promise<string> {
        const config = this.config;
        const receiptData = this.formatReceiptData(sale);
        const qrCodeUrl = config.showQRCode
            ? await this.generateQRCode(`VENDA:${sale.id}`)
            : '';

        const width = config.paperWidth === '80mm' ? '80mm' : '58mm';
        const fontSize = config.fontSize === 'small' ? '10px' : config.fontSize === 'large' ? '14px' : '12px';

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Comprovante - ${config.storeName}</title>
  <style>
    @page {
      size: ${width} auto;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: ${width};
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSize};
      line-height: 1.4;
      padding: 5mm;
      background: white;
      color: black;
    }

    .center {
      text-align: center;
    }

    .bold {
      font-weight: bold;
    }

    .large {
      font-size: ${config.fontSize === 'small' ? '14px' : config.fontSize === 'large' ? '18px' : '16px'};
    }

    .divider {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }

    .double-divider {
      border-top: 2px solid #000;
      margin: 5px 0;
    }

    .header {
      margin-bottom: 10px;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }

    .item-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding-right: 10px;
    }

    .item-qty {
      width: 60px;
      text-align: center;
    }

    .item-price {
      width: 70px;
      text-align: right;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-weight: bold;
    }

    .qr-code {
      text-align: center;
      margin: 10px 0;
    }

    .qr-code img {
      width: 120px;
      height: 120px;
    }

    .footer {
      margin-top: 10px;
      text-align: center;
      font-size: ${config.fontSize === 'small' ? '8px' : '10px'};
    }

    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header center">
    <div class="bold large">${config.storeName}</div>
    <div>${config.storeAddress}</div>
    <div>Tel: ${config.storePhone}</div>
    <div>CNPJ: ${config.storeCNPJ}</div>
  </div>

  <div class="double-divider"></div>

  <!-- Sale Info -->
  <div class="center bold">COMPROVANTE DE VENDA</div>
  <div class="divider"></div>
  
  <div>Data: ${receiptData.formattedDate}</div>
  <div>Hora: ${receiptData.formattedTime}</div>
  ${receiptData.customerName ? `<div>Cliente: ${receiptData.customerName}</div>` : ''}
  ${receiptData.customerCpf ? `<div>CPF: ${receiptData.customerCpf}</div>` : ''}
  <div>Venda: #${sale.id}</div>

  <div class="divider"></div>

  <!-- Items -->
  <div class="bold">ITENS DA COMPRA</div>
  <div class="divider"></div>

  ${receiptData.items.map(item => `
    <div>
      <div class="item-name bold">${item.name}</div>
      <div class="item-row">
        <span>${item.quantity}x R$ ${item.priceSell.toFixed(2)}</span>
        <span>R$ ${(item.quantity * item.priceSell).toFixed(2)}</span>
      </div>
    </div>
  `).join('')}

  <div class="divider"></div>

  <!-- Payments -->
  <div class="bold">FORMA DE PAGAMENTO</div>
  <div class="divider"></div>

  ${receiptData.payments.map(payment => `
    <div class="total-row">
      <span>${payment.method}</span>
      <span>R$ ${payment.amount.toFixed(2)}</span>
    </div>
  `).join('')}

  <div class="double-divider"></div>

  <!-- Total -->
  <div class="total-row large">
    <span>TOTAL</span>
    <span>R$ ${receiptData.total.toFixed(2)}</span>
  </div>

  <div class="double-divider"></div>

  ${config.showQRCode && qrCodeUrl ? `
    <div class="qr-code">
      <img src="${qrCodeUrl}" alt="QR Code" />
      <div>Código da Venda</div>
    </div>
    <div class="divider"></div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    <div>Obrigado pela preferência!</div>
    <div>Volte sempre!</div>
    <div style="margin-top: 5px;">www.gestorpro.com.br</div>
  </div>

  ${config.autoCut ? '<div style="page-break-after: always;"></div>' : ''}

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `.trim();
    }

    // Print thermal receipt
    static async printReceipt(sale: Sale) {
        const html = await this.generateThermalReceipt(sale);
        const printWindow = window.open('', '_blank', 'width=400,height=800');

        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    }

    // Generate barcode label for thermal printer
    static generateBarcodeLabel(product: {
        name: string;
        barcode: string;
        priceSell: number;
    }): string {
        const config = this.config;
        const width = config.paperWidth === '80mm' ? '80mm' : '58mm';

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etiqueta - ${product.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${width} 40mm;
      margin: 0;
    }

    body {
      width: ${width};
      height: 40mm;
      font-family: 'Inter', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0;
      padding: 5mm;
      background: white;
    }

    .label {
      text-align: center;
      width: 100%;
    }

    .name {
      font-size: ${config.paperWidth === '80mm' ? '14px' : '11px'};
      font-weight: 700;
      margin-bottom: 3px;
      text-transform: uppercase;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .price {
      font-size: ${config.paperWidth === '80mm' ? '20px' : '16px'};
      font-weight: 800;
      margin: 5px 0;
    }

    .barcode {
      font-family: 'Libre Barcode 39', cursive;
      font-size: ${config.paperWidth === '80mm' ? '50px' : '40px'};
      line-height: 1;
      margin: 5px 0;
    }

    .barcode-text {
      font-family: monospace;
      font-size: ${config.paperWidth === '80mm' ? '12px' : '10px'};
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="name">${product.name}</div>
    <div class="price">R$ ${product.priceSell.toFixed(2)}</div>
    <div class="barcode">*${product.barcode}*</div>
    <div class="barcode-text">${product.barcode}</div>
  </div>
  <script>
    document.fonts.ready.then(() => {
      setTimeout(() => window.print(), 500);
    });
  </script>
</body>
</html>
    `.trim();
    }

    // Print barcode label
    static printBarcodeLabel(product: { name: string; barcode: string; priceSell: number }) {
        const html = this.generateBarcodeLabel(product);
        const printWindow = window.open('', '_blank', 'width=400,height=300');

        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    }
}

// Initialize config on load
ThermalPrintService.loadConfig();

export default ThermalPrintService;
