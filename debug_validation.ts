
import {
    ProductSchema,
    SaleSchema,
    validateSafe
} from './schemas/validation';
import * as fs from 'fs';

const log = (msg: string) => fs.appendFileSync('debug_test_output.txt', msg + '\n');

console.log('Starting debug test...');
log('Starting debug test...');

// Test 1: Sale Total Mismatch
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

const resultSale = validateSafe(SaleSchema, invalidSale);
log('Sale Validation Result: ' + JSON.stringify(resultSale, null, 2));

// Test 2: Product Price Negative
const invalidProduct = {
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Produto Teste',
    category: 'Eletrônicos',
    priceSell: -10,
    priceCost: 50,
    stock: 10,
    minStock: 2
};
const resultProduct = validateSafe(ProductSchema, invalidProduct);
log('Product Validation Result: ' + JSON.stringify(resultProduct, null, 2));
