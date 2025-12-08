import React, { useState } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { CashSession, PaymentMethod } from '../types';
import { X, Printer, Check } from 'lucide-react';

// --- OPEN BOX MODAL ---
export const OpenBoxModal = ({ userId, onClose, onSuccess }: any) => {
  const [fund, setFund] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = await SupabaseService.openSession(userId, Number(fund));
      onSuccess(session.id);
    } catch (error) {
      console.error('Error opening session:', error);
      alert('Erro ao abrir caixa');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Abrir Sessão de Caixa</h3>
        <p className="text-sm text-slate-500 mb-4">
          Inicie o dia ou turno de trabalho informando o fundo de troco disponível.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Fundo de Caixa (R$)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={fund}
              onChange={e => setFund(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Abrir Caixa</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ADD FUND MODAL ---
export const AddFundModal = ({ sessionId, onClose }: any) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SupabaseService.addCashMovement({
        id: crypto.randomUUID(),
        sessionId,
        type: 'ADD_FUND',
        amount: Number(amount),
        note,
        timestamp: new Date().toISOString()
      });
      alert('Fundo adicionado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error adding fund:', error);
      alert('Erro ao adicionar fundo');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Adicionar Fundo (Suprimento)</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Valor (R$)</label>
            <input required type="number" step="0.01" className="w-full border p-2 rounded" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Justificativa</label>
            <input type="text" className="w-full border p-2 rounded" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- REGISTER TOTALS & RECEIPT MODAL ---
interface RegisterTotalsProps {
  session: CashSession;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegisterTotalsModal = ({ session, onClose, onSuccess }: RegisterTotalsProps) => {
  const [totals, setTotals] = useState<Record<string, number>>({
    [PaymentMethod.CASH]: 0,
    [PaymentMethod.CREDIT_CARD]: 0,
    [PaymentMethod.DEBIT_CARD]: 0,
    [PaymentMethod.PIX]: 0,
  });

  const handleSaveAndPrint = async () => {
    try {
      // Save totals first
      await SupabaseService.updateSessionTotals(session.id, totals);

      // Calculate Grand Total
      const grandTotal = (Object.values(totals) as number[]).reduce((a, b) => a + b, 0);

      // Notify parent
      if (onSuccess) onSuccess();

      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Comprovante de Fechamento</title>
              <style>
                body { font-family: monospace; padding: 20px; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border-bottom: 1px dashed #000; padding: 5px; text-align: left; }
                .right { text-align: right; }
                .total { font-size: 1.2em; font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; }
                .signature { margin-top: 40px; border-top: 1px solid #000; padding-top: 5px; }
              </style>
            </head>
            <body>
              <h2>GESTOR PRO - COMPROVANTE</h2>
              <p>Data: ${new Date().toLocaleString()}</p>
              <p>Sessão ID: ${session.id}</p>
              <p>Operador ID: ${session.openedByUserId}</p>
              <hr/>
              <table>
                <tr><th>Forma Pagto</th><th class="right">Valor Informado</th></tr>
                ${(Object.entries(totals) as [string, number][]).map(([key, val]) => `
                  <tr><td>${key}</td><td class="right">R$ ${val.toFixed(2)}</td></tr>
                `).join('')}
              </table>
              <div class="total">
                TOTAL GERAL: R$ ${grandTotal.toFixed(2)}
              </div>
              <div class="signature">
                Assinatura do Operador
              </div>
              <script>window.print();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      // Close modal if onSuccess didn't already trigger a view change
      if (!onSuccess) onClose();
    } catch (error) {
      console.error('Error saving totals:', error);
      alert('Erro ao salvar totais');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Registrar Totais (Conferência)</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-500">Informe os valores contados fisicamente no caixa ou na maquininha.</p>

          {Object.values(PaymentMethod).map((method) => (
            <div key={method} className="flex items-center gap-4">
              <label className="w-1/2 text-sm font-medium text-slate-700">{method}</label>
              <input
                type="number"
                step="0.01"
                className="w-1/2 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={totals[method] || ''}
                onChange={e => setTotals({ ...totals, [method]: parseFloat(e.target.value) || 0 })}
              />
            </div>
          ))}

          <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={handleSaveAndPrint}
              className="flex-1 bg-slate-800 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-900"
            >
              <Printer size={18} /> Salvar e Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};