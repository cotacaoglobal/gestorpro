import React, { useState, useRef } from 'react';
import { X, Download, Share2, MessageCircle, Mail, FileText, Image as ImageIcon, FileCheck } from 'lucide-react';
import { Sale } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SaleSuccessModalProps {
    sale: Sale;
    onClose: () => void;
    onNewClient: () => void;
}

type ShareFormat = 'text' | 'image' | 'pdf';

export const SaleSuccessModal: React.FC<SaleSuccessModalProps> = ({ sale, onClose, onNewClient }) => {
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [showWhatsAppInput, setShowWhatsAppInput] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedFormat, setSelectedFormat] = useState<ShareFormat>('text');
    const receiptRef = useRef<HTMLDivElement>(null);

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhoneNumber(formatted);
    };

    const generateTextReceipt = () => {
        const date = new Date(sale.date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let text = `🧾 *COMPROVANTE DE VENDA*\n\n`;
        text += `📅 Data: ${formattedDate}\n`;
        text += `🕐 Hora: ${formattedTime}\n`;
        if (sale.customerName) text += `👤 Cliente: ${sale.customerName}\n`;
        if (sale.customerCpf) text += `🆔 CPF: ${sale.customerCpf}\n`;
        text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        text += `*ITENS DA COMPRA*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        sale.items.forEach(item => {
            const itemTotal = item.priceSell * item.quantity;
            text += `${item.name}\n`;
            text += `${item.quantity}x R$ ${item.priceSell.toFixed(2)} = R$ ${itemTotal.toFixed(2)}\n\n`;
        });

        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `*PAGAMENTO*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        sale.payments.forEach(payment => {
            text += `${payment.method}: R$ ${payment.amount.toFixed(2)}\n`;
        });

        text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        text += `💰 *TOTAL: R$ ${sale.total.toFixed(2)}*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `\n✅ Venda ID: ${sale.id.substring(0, 8)}\n`;
        text += `\nObrigado pela preferência! 😊`;

        return encodeURIComponent(text);
    };

    const generatePDF = async () => {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200] // Tamanho de cupom térmico
        });

        const date = new Date(sale.date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Configurações
        pdf.setFontSize(12);
        let y = 10;

        // Título
        pdf.setFont('helvetica', 'bold');
        pdf.text('COMPROVANTE DE VENDA', 40, y, { align: 'center' });
        y += 8;

        // Linha
        pdf.line(5, y, 75, y);
        y += 6;

        // Informações
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Data: ${formattedDate}`, 5, y);
        y += 5;
        pdf.text(`Hora: ${formattedTime}`, 5, y);
        y += 5;

        if (sale.customerName) {
            pdf.text(`Cliente: ${sale.customerName}`, 5, y);
            y += 5;
        }
        if (sale.customerCpf) {
            pdf.text(`CPF: ${sale.customerCpf}`, 5, y);
            y += 5;
        }

        y += 3;
        pdf.line(5, y, 75, y);
        y += 6;

        // Itens
        pdf.setFont('helvetica', 'bold');
        pdf.text('ITENS', 5, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');

        sale.items.forEach(item => {
            const itemTotal = item.priceSell * item.quantity;
            pdf.text(item.name, 5, y);
            y += 4;
            pdf.text(`${item.quantity}x R$ ${item.priceSell.toFixed(2)}`, 5, y);
            pdf.text(`R$ ${itemTotal.toFixed(2)}`, 75, y, { align: 'right' });
            y += 6;
        });

        y += 2;
        pdf.line(5, y, 75, y);
        y += 6;

        // Pagamento
        pdf.setFont('helvetica', 'bold');
        pdf.text('PAGAMENTO', 5, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');

        sale.payments.forEach(payment => {
            pdf.text(payment.method, 5, y);
            pdf.text(`R$ ${payment.amount.toFixed(2)}`, 75, y, { align: 'right' });
            y += 5;
        });

        y += 3;
        pdf.line(5, y, 75, y);
        y += 6;

        // Total
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`TOTAL: R$ ${sale.total.toFixed(2)}`, 40, y, { align: 'center' });
        y += 8;

        // ID da venda
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`ID: ${sale.id.substring(0, 8)}`, 40, y, { align: 'center' });
        y += 6;

        pdf.text('Obrigado pela preferência!', 40, y, { align: 'center' });

        return pdf;
    };

    const generateImage = async () => {
        if (!receiptRef.current) return null;

        const canvas = await html2canvas(receiptRef.current, {
            backgroundColor: '#ffffff',
            scale: 2
        });

        return canvas.toDataURL('image/png');
    };

    const handleDownloadPDF = async () => {
        const pdf = await generatePDF();
        pdf.save(`comprovante-${sale.id.substring(0, 8)}.pdf`);
    };

    const handleDownloadImage = async () => {
        const imageData = await generateImage();
        if (imageData) {
            const link = document.createElement('a');
            link.download = `comprovante-${sale.id.substring(0, 8)}.png`;
            link.href = imageData;
            link.click();
        }
    };

    const handleSendWhatsApp = async () => {
        const cleanPhone = phoneNumber.replace(/\D/g, '');

        if (cleanPhone.length < 10) {
            alert('Por favor, insira um número de telefone válido');
            return;
        }

        let whatsappUrl = '';

        if (selectedFormat === 'text') {
            const textReceipt = generateTextReceipt();
            whatsappUrl = `https://wa.me/55${cleanPhone}?text=${textReceipt}`;
        } else if (selectedFormat === 'pdf') {
            // Para PDF e imagem, abre o WhatsApp com mensagem pedindo para enviar manualmente
            const message = encodeURIComponent(
                `Olá! Segue o comprovante da sua compra:\n\n` +
                `Total: R$ ${sale.total.toFixed(2)}\n` +
                `Data: ${new Date(sale.date).toLocaleDateString('pt-BR')}\n\n` +
                `O comprovante em PDF será baixado automaticamente. Por favor, envie-o para o cliente.`
            );
            whatsappUrl = `https://wa.me/55${cleanPhone}?text=${message}`;

            // Baixa o PDF automaticamente
            await handleDownloadPDF();
        } else if (selectedFormat === 'image') {
            const message = encodeURIComponent(
                `Olá! Segue o comprovante da sua compra:\n\n` +
                `Total: R$ ${sale.total.toFixed(2)}\n` +
                `Data: ${new Date(sale.date).toLocaleDateString('pt-BR')}\n\n` +
                `O comprovante em imagem será baixado automaticamente. Por favor, envie-o para o cliente.`
            );
            whatsappUrl = `https://wa.me/55${cleanPhone}?text=${message}`;

            // Baixa a imagem automaticamente
            await handleDownloadImage();
        }

        window.open(whatsappUrl, '_blank');

        // Fecha os modais após enviar
        setTimeout(() => {
            setShowWhatsAppInput(false);
            setShowShareOptions(false);
        }, 500);
    };

    const date = new Date(sale.date);
    const formattedDate = date.toLocaleDateString('pt-BR');
    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            {/* Comprovante oculto para captura de imagem */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={receiptRef} style={{
                    width: '300px',
                    padding: '20px',
                    backgroundColor: 'white',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                }}>
                    <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>COMPROVANTE DE VENDA</h2>
                    <hr />
                    <p><strong>Data:</strong> {formattedDate}</p>
                    <p><strong>Hora:</strong> {formattedTime}</p>
                    {sale.customerName && <p><strong>Cliente:</strong> {sale.customerName}</p>}
                    {sale.customerCpf && <p><strong>CPF:</strong> {sale.customerCpf}</p>}
                    <hr />
                    <h3>ITENS</h3>
                    {sale.items.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '10px' }}>
                            <p style={{ margin: '2px 0' }}>{item.name}</p>
                            <p style={{ margin: '2px 0' }}>
                                {item.quantity}x R$ {item.priceSell.toFixed(2)} = R$ {(item.priceSell * item.quantity).toFixed(2)}
                            </p>
                        </div>
                    ))}
                    <hr />
                    <h3>PAGAMENTO</h3>
                    {sale.payments.map((payment, idx) => (
                        <p key={idx}>{payment.method}: R$ {payment.amount.toFixed(2)}</p>
                    ))}
                    <hr />
                    <h2 style={{ textAlign: 'center' }}>TOTAL: R$ {sale.total.toFixed(2)}</h2>
                    <p style={{ textAlign: 'center', fontSize: '10px' }}>ID: {sale.id.substring(0, 8)}</p>
                    <p style={{ textAlign: 'center' }}>Obrigado pela preferência!</p>
                </div>
            </div>

            {/* Modal Principal */}
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-8">
                        <div className="flex items-center justify-center mb-6">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                <FileCheck size={32} />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-center text-slate-800 mb-2">
                            Venda Confirmada!
                        </h2>
                        <p className="text-center text-slate-500 mb-6">
                            Total: <span className="font-bold text-emerald-600 text-xl">R$ {sale.total.toFixed(2)}</span>
                        </p>

                        {!showShareOptions && !showWhatsAppInput && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowShareOptions(true)}
                                    className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-3"
                                >
                                    <Share2 size={20} />
                                    Compartilhar Comprovante
                                </button>

                                <button
                                    onClick={onNewClient}
                                    className="w-full py-4 rounded-xl font-bold bg-violet-500 text-white hover:bg-violet-600 transition-colors flex items-center justify-center gap-3"
                                >
                                    🔄 Novo Cliente
                                </button>

                                <button
                                    onClick={onClose}
                                    className="w-full py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        )}

                        {showShareOptions && !showWhatsAppInput && (
                            <div className="space-y-3 animate-in slide-in-from-right duration-300">
                                <h3 className="font-bold text-slate-700 mb-4">Como deseja compartilhar?</h3>

                                <button
                                    onClick={() => setShowWhatsAppInput(true)}
                                    className="w-full py-4 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-3"
                                >
                                    <MessageCircle size={20} />
                                    Enviar por WhatsApp
                                </button>

                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full py-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-3"
                                >
                                    <FileText size={20} />
                                    Baixar PDF
                                </button>

                                <button
                                    onClick={handleDownloadImage}
                                    className="w-full py-4 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-3"
                                >
                                    <ImageIcon size={20} />
                                    Baixar Imagem
                                </button>

                                <button
                                    onClick={() => setShowShareOptions(false)}
                                    className="w-full py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Voltar
                                </button>
                            </div>
                        )}

                        {showWhatsAppInput && (
                            <div className="space-y-4 animate-in slide-in-from-right duration-300">
                                <h3 className="font-bold text-slate-700 mb-2">Enviar por WhatsApp</h3>

                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">
                                        Telefone do Cliente
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={handlePhoneChange}
                                        placeholder="(11) 99999-9999"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 outline-none font-medium"
                                        maxLength={15}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">
                                        Formato
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setSelectedFormat('text')}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all ${selectedFormat === 'text'
                                                    ? 'bg-green-500 text-white shadow-lg'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            <FileText size={16} className="mx-auto mb-1" />
                                            Texto
                                        </button>
                                        <button
                                            onClick={() => setSelectedFormat('image')}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all ${selectedFormat === 'image'
                                                    ? 'bg-green-500 text-white shadow-lg'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            <ImageIcon size={16} className="mx-auto mb-1" />
                                            Imagem
                                        </button>
                                        <button
                                            onClick={() => setSelectedFormat('pdf')}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all ${selectedFormat === 'pdf'
                                                    ? 'bg-green-500 text-white shadow-lg'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            <Download size={16} className="mx-auto mb-1" />
                                            PDF
                                        </button>
                                    </div>
                                </div>

                                {(selectedFormat === 'pdf' || selectedFormat === 'image') && (
                                    <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                        ℹ️ O arquivo será baixado automaticamente. Depois, envie-o manualmente pelo WhatsApp Web.
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowWhatsAppInput(false)}
                                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        onClick={handleSendWhatsApp}
                                        className="flex-[2] py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={18} />
                                        Abrir WhatsApp
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
