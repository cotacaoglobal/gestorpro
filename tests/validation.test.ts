import { describe, it, expect } from 'vitest';
import {
    ProductSchema,
    SaleSchema,
    UserSchema,
    CustomerSchema,
    validateSafe,
    validateOrThrow
} from '../schemas/validation';

describe('Validation Schemas', () => {

    describe('ProductSchema', () => {
        it('should validate a valid product', () => {
            const validProduct = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Produto Teste',
                category: 'Eletrônicos',
                priceSell: 100.50,
                priceCost: 50.25,
                stock: 10,
                minStock: 2,
                barcode: '7891234567890'
            };

            const result = validateSafe(ProductSchema, validProduct);
            expect(result.success).toBe(true);
        });

        it('should reject negative prices', () => {
            const invalidProduct = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Produto Teste',
                category: 'Eletrônicos',
                priceSell: -10,
                priceCost: 50,
                stock: 10,
                minStock: 2
            };

            const result = validateSafe(ProductSchema, invalidProduct);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors.some(e => e.includes('positivo'))).toBe(true);
            }
        });

        it('should warn when sell price < cost price', () => {
            const product = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Produto Teste',
                category: 'Eletrônicos',
                priceSell: 40,
                priceCost: 50,
                stock: 10,
                minStock: 2
            };

            const result = validateSafe(ProductSchema, product);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors.some(e => e.includes('prejuízo'))).toBe(true);
            }
        });

        it('should validate barcode format', () => {
            const invalidBarcode = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Produto Teste',
                category: 'Eletrônicos',
                priceSell: 100,
                priceCost: 50,
                stock: 10,
                minStock: 2,
                barcode: '123' // Muito curto
            };

            const result = validateSafe(ProductSchema, invalidBarcode);
            expect(result.success).toBe(false);
        });
    });

    describe('CustomerSchema', () => {
        it('should validate a valid customer', () => {
            const validCustomer = {
                name: 'João Silva',
                cpf: '123.456.789-00'
            };

            const result = validateSafe(CustomerSchema, validCustomer);
            expect(result.success).toBe(true);
        });

        it('should reject names with numbers', () => {
            const invalidCustomer = {
                name: 'João123',
                cpf: '123.456.789-00'
            };

            const result = validateSafe(CustomerSchema, invalidCustomer);
            expect(result.success).toBe(false);
        });

        it('should reject invalid CPF format', () => {
            const invalidCustomer = {
                name: 'João Silva',
                cpf: '12345678900' // Sem formatação
            };

            const result = validateSafe(CustomerSchema, invalidCustomer);
            expect(result.success).toBe(false);
        });

        it('should accept empty CPF (optional)', () => {
            const customer = {
                name: 'João Silva',
                cpf: ''
            };

            const result = validateSafe(CustomerSchema, customer);
            expect(result.success).toBe(true);
        });
    });

    describe('SaleSchema', () => {
        it('should validate a valid sale', () => {
            const validSale = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                date: new Date().toISOString(),
                items: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174002',
                        name: 'Produto 1',
                        quantity: 2,
                        price: 50,
                        discount: 0
                    }
                ],
                total: 100,
                payments: [
                    {
                        method: 'DINHEIRO' as const,
                        amount: 100
                    }
                ]
            };

            const result = validateSafe(SaleSchema, validSale);
            expect(result.success).toBe(true);
        });

        it('should reject sale with total mismatch', () => {
            const invalidSale = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                date: new Date().toISOString(),
                items: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174002',
                        name: 'Produto 1',
                        quantity: 2,
                        price: 50,
                        discount: 0
                    }
                ],
                total: 150, // Errado! Deveria ser 100
                payments: [
                    {
                        method: 'DINHEIRO' as const,
                        amount: 150
                    }
                ]
            };

            const result = validateSafe(SaleSchema, invalidSale);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors.some(e => e.includes('Total da venda'))).toBe(true);
            }
        });

        it('should reject quantity > 10000', () => {
            const invalidSale = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                date: new Date().toISOString(),
                items: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174002',
                        name: 'Produto 1',
                        quantity: 15000, // Muito alto
                        price: 1,
                        discount: 0
                    }
                ],
                total: 15000,
                payments: [
                    {
                        method: 'DINHEIRO' as const,
                        amount: 15000
                    }
                ]
            };

            const result = validateSafe(SaleSchema, invalidSale);
            expect(result.success).toBe(false);
        });

        it('should validate sale with discount', () => {
            const saleWithDiscount = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                date: new Date().toISOString(),
                items: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174002',
                        name: 'Produto 1',
                        quantity: 2,
                        price: 50,
                        discount: 10 // 10% de desconto
                    }
                ],
                total: 90, // 100 - 10% = 90
                payments: [
                    {
                        method: 'PIX' as const,
                        amount: 90
                    }
                ]
            };

            const result = validateSafe(SaleSchema, saleWithDiscount);
            expect(result.success).toBe(true);
        });
    });

    describe('UserSchema', () => {
        it('should validate a valid user', () => {
            const validUser = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'João Silva',
                email: 'joao@example.com',
                role: 'admin' as const
            };

            const result = validateSafe(UserSchema, validUser);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const invalidUser = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'João Silva',
                email: 'invalid-email',
                role: 'admin' as const
            };

            const result = validateSafe(UserSchema, invalidUser);
            expect(result.success).toBe(false);
        });

        it('should normalize email to lowercase', () => {
            const user = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'João Silva',
                email: 'JOAO@EXAMPLE.COM',
                role: 'operator' as const
            };

            const result = validateSafe(UserSchema, user);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('joao@example.com');
            }
        });
    });

    describe('validateOrThrow', () => {
        it('should return data when valid', () => {
            const validProduct = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Produto Teste',
                category: 'Eletrônicos',
                priceSell: 100,
                priceCost: 50,
                stock: 10,
                minStock: 2
            };

            expect(() => validateOrThrow(ProductSchema, validProduct)).not.toThrow();
            const result = validateOrThrow(ProductSchema, validProduct);
            expect(result.name).toBe('Produto Teste');
        });

        it('should throw error when invalid', () => {
            const invalidProduct = {
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                name: '',
                category: 'Eletrônicos',
                priceSell: -10,
                priceCost: 50,
                stock: 10,
                minStock: 2
            };

            expect(() => validateOrThrow(ProductSchema, invalidProduct)).toThrow('Validação falhou');
        });
    });
});
