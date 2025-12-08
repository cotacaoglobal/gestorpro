import React from 'react';
import { Calculator, X, Percent, DollarSign, Plus, Minus, ShoppingCart, Tag } from 'lucide-react';

// Calculator Modal Component
interface CalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    display: string;
    onNumber: (num: string) => void;
    onOperation: (op: string) => void;
    onEquals: () => void;
    onClear: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
    isOpen,
    onClose,
    display,
    onNumber,
    onOperation,
    onEquals,
    onClear
}) => {
    if (!isOpen) return null;

    const buttons = [
        ['7', '8', '9', '/'],
        ['4', '5', '6', '*'],
        ['1', '2', '3', '-'],
        ['0', '.', '=', '+']
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Calculator size={20} className="text-violet-600" />
                        <h3 className="text-xl font-bold text-slate-800">Calculadora</h3>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-slate-900 text-white p-6 rounded-2xl mb-4 text-right text-3xl font-black min-h-[80px] flex items-center justify-end">
                        {display}
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {buttons.map((row, i) => (
                            <React.Fragment key={i}>
                                {row.map(btn => (
                                    <button
                                        key={btn}
                                        onClick={() => {
                                            if (btn === '=') onEquals();
                                            else if (['+', '-', '*', '/'].includes(btn)) onOperation(btn);
                                            else onNumber(btn);
                                        }}
                                        className={`p-4 rounded-xl font-bold text-lg transition-all ${btn === '=' ? 'bg-violet-600 text-white hover:bg-violet-700' :
                                                ['+', '-', '*', '/'].includes(btn) ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' :
                                                    'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                            }`}
                                    >
                                        {btn}
                                    </button>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>

                    <button
                        onClick={onClear}
                        className="w-full py-3 bg-rose-100 text-rose-600 rounded-xl font-bold hover:bg-rose-200 transition-colors"
                    >
                        Limpar (C)
                    </button>
                </div>
            </div>
        </div>
    );
};

// Discount Modal Component
interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    discountType: 'percent' | 'fixed';
    setDiscountType: (type: 'percent' | 'fixed') => void;
    discountValue: string;
    setDiscountValue: (value: string) => void;
    onApply: () => void;
    subtotal: number;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
    isOpen,
    onClose,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    onApply,
    subtotal
}) => {
    if (!isOpen) return null;

    const calculatePreview = () => {
        const value = parseFloat(discountValue) || 0;
        if (discountType === 'percent') {
            return (subtotal * value) / 100;
        }
        return Math.min(value, subtotal);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Tag size={20} className="text-violet-600" />
                        <h3 className="text-xl font-bold text-slate-800">Aplicar Desconto</h3>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Desconto</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDiscountType('percent')}
                                className={`p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${discountType === 'percent' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Percent size={18} />
                                Porcentagem
                            </button>
                            <button
                                onClick={() => setDiscountType('fixed')}
                                className={`p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${discountType === 'fixed' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <DollarSign size={18} />
                                Valor Fixo
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            {discountType === 'percent' ? 'Porcentagem (%)' : 'Valor (R$)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={discountType === 'percent' ? '100' : subtotal.toString()}
                            step="0.01"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="w-full text-center text-3xl font-black bg-slate-50 border-none rounded-2xl py-4 focus:ring-2 focus:ring-violet-500"
                            autoFocus
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-500">Subtotal:</span>
                            <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-500">Desconto:</span>
                            <span className="font-bold text-rose-600">- R$ {calculatePreview().toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 mt-2">
                            <div className="flex justify-between">
                                <span className="font-bold">Total:</span>
                                <span className="text-2xl font-black text-violet-600">R$ {(subtotal - calculatePreview()).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 text-slate-600 hover:bg-slate-50 rounded-2xl font-bold transition-colors"
                        >
                            Cancelar <span className="text-xs text-slate-400">(ESC)</span>
                        </button>
                        <button
                            onClick={onApply}
                            className="flex-[2] py-4 bg-violet-600 text-white hover:bg-violet-700 rounded-2xl font-bold shadow-lg shadow-violet-200 transition-all"
                        >
                            Aplicar Desconto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
