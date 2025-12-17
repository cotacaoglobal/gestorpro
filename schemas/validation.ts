import { z } from 'zod';

/**
 * Schemas de Validação - GESTOR PRO
 * Implementa validação robusta de inputs para segurança e integridade de dados
 */

// ============================================================================
// VALIDAÇÕES DE PRODUTO
// ============================================================================

export const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  category: z.string()
    .min(1, 'Categoria é obrigatória')
    .max(50, 'Categoria deve ter no máximo 50 caracteres'),
  internalCode: z.string()
    .max(50, 'Código interno deve ter no máximo 50 caracteres')
    .optional(),
  barcode: z.string()
    .regex(/^\d{8,13}$/, 'Código de barras deve ter entre 8 e 13 dígitos')
    .optional()
    .or(z.literal('')),
  priceSell: z.number()
    .positive('Preço de venda deve ser positivo')
    .max(1000000, 'Preço de venda muito alto')
    .multipleOf(0.01, 'Preço deve ter no máximo 2 casas decimais'),
  priceCost: z.number()
    .nonnegative('Preço de custo não pode ser negativo')
    .max(1000000, 'Preço de custo muito alto')
    .multipleOf(0.01, 'Preço deve ter no máximo 2 casas decimais'),
  stock: z.number()
    .int('Estoque deve ser um número inteiro')
    .nonnegative('Estoque não pode ser negativo')
    .max(1000000, 'Estoque muito alto'),
  minStock: z.number()
    .int('Estoque mínimo deve ser um número inteiro')
    .nonnegative('Estoque mínimo não pode ser negativo')
    .max(100000, 'Estoque mínimo muito alto'),
  supplier: z.string()
    .max(100, 'Nome do fornecedor deve ter no máximo 100 caracteres')
    .optional(),
  image: z.string()
    .url('URL da imagem inválida')
    .optional()
    .or(z.literal(''))
}).refine(
  (data) => data.priceSell >= data.priceCost,
  {
    message: '⚠️ Preço de venda menor que custo (possível prejuízo)',
    path: ['priceSell']
  }
);

export type ValidatedProduct = z.infer<typeof ProductSchema>;

// ============================================================================
// VALIDAÇÕES DE CLIENTE
// ============================================================================

export const CustomerSchema = z.object({
  name: z.string()
    .min(1, 'Nome do cliente é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .trim(),
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX')
    .optional()
    .or(z.literal(''))
});

export type ValidatedCustomer = z.infer<typeof CustomerSchema>;

// ============================================================================
// VALIDAÇÕES DE VENDA
// ============================================================================

export const SaleItemSchema = z.object({
  id: z.string().uuid('ID do produto inválido'),
  name: z.string().min(1, 'Nome do produto é obrigatório'),
  quantity: z.number()
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser positiva')
    .max(10000, 'Quantidade muito alta (máximo 10.000)'),
  price: z.number()
    .positive('Preço deve ser positivo')
    .max(1000000, 'Preço muito alto'),
  discount: z.number()
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100%')
    .default(0)
});

export const PaymentSchema = z.object({
  method: z.enum(['DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'PIX', 'OUTROS'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }),
  amount: z.number()
    .positive('Valor do pagamento deve ser positivo')
    .max(1000000, 'Valor muito alto')
});

export const SaleSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid('Tenant ID inválido'),
  sessionId: z.string().uuid('Session ID inválido').optional(),
  userId: z.string().uuid('User ID inválido'),
  customerName: z.string()
    .max(100, 'Nome do cliente muito longo')
    .optional()
    .or(z.literal('')),
  customerCpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
    .optional()
    .or(z.literal('')),
  date: z.string().datetime('Data inválida'),
  items: z.array(SaleItemSchema)
    .min(1, 'Venda deve ter pelo menos 1 item')
    .max(100, 'Venda não pode ter mais de 100 itens'),
  total: z.number()
    .positive('Total da venda deve ser positivo')
    .max(1000000, 'Total muito alto')
    .multipleOf(0.01, 'Total deve ter no máximo 2 casas decimais'),
  payments: z.array(PaymentSchema)
    .min(1, 'Venda deve ter pelo menos 1 forma de pagamento')
}).refine(
  (data) => {
    const itemsTotal = data.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const discount = itemTotal * (item.discount / 100);
      return sum + (itemTotal - discount);
    }, 0);
    return Math.abs(itemsTotal - data.total) < 0.01; // Tolerância de 1 centavo
  },
  {
    message: 'Total da venda não corresponde à soma dos itens',
    path: ['total']
  }
).refine(
  (data) => {
    const paymentsTotal = data.payments.reduce((sum, p) => sum + p.amount, 0);
    return Math.abs(paymentsTotal - data.total) < 0.01;
  },
  {
    message: 'Total dos pagamentos não corresponde ao total da venda',
    path: ['payments']
  }
);

export type ValidatedSale = z.infer<typeof SaleSchema>;

// ============================================================================
// VALIDAÇÕES DE USUÁRIO
// ============================================================================

export const PasswordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(100, 'Senha muito longa')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Senha deve conter pelo menos um caractere especial');

export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid('Tenant ID inválido'),
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email muito longo')
    .toLowerCase()
    .trim(),
  passwordHash: z.string().optional(),
  role: z.enum(['admin', 'operator', 'super_admin'], {
    errorMap: () => ({ message: 'Função inválida' })
  }),
  avatar: z.string()
    .url('URL do avatar inválida')
    .optional()
    .or(z.literal(''))
});

export type ValidatedUser = z.infer<typeof UserSchema>;

// ============================================================================
// VALIDAÇÕES DE MOVIMENTAÇÃO DE CAIXA
// ============================================================================

export const CashMovementSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  type: z.enum(['OPENING', 'SALE', 'WITHDRAWAL', 'DEPOSIT', 'CLOSING'], {
    errorMap: () => ({ message: 'Tipo de movimentação inválido' })
  }),
  amount: z.number()
    .multipleOf(0.01, 'Valor deve ter no máximo 2 casas decimais')
    .max(1000000, 'Valor muito alto'),
  note: z.string()
    .max(500, 'Observação muito longa')
    .optional(),
  timestamp: z.string().datetime()
});

export type ValidatedCashMovement = z.infer<typeof CashMovementSchema>;

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Valida e retorna dados ou lança erro com mensagens formatadas
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Validação falhou:\n${messages}`);
    }
    throw error;
  }
}

/**
 * Valida e retorna resultado com sucesso/erro
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  };
}
