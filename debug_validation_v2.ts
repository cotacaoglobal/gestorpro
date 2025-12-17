
import {
    ProductSchema,
    SaleSchema,
} from './schemas/validation';
import * as fs from 'fs';

const log = (msg: string) => fs.appendFileSync('debug_test_output_v2.txt', msg + '\n');

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

const resultSale = SaleSchema.safeParse(invalidSale);
log('Raw Sale SafeParse Result:');
if (!resultSale.success) {
    log(JSON.stringify(resultSale.error, null, 2));
} else {
    log('Success (Unexpected)');
}
