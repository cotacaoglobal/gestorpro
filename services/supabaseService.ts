import { supabase } from './supabaseClient';
import { Product, Sale, User, CashSession, CashMovement } from '../types';

export const SupabaseService = {
    // --- Products ---
    getProducts: async (): Promise<Product[]> => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name');

        if (error) throw error;

        // Map database fields to app types
        return (data || []).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            internalCode: p.internal_code,
            barcode: p.barcode,
            priceSell: parseFloat(p.price_sell),
            priceCost: parseFloat(p.price_cost),
            stock: p.stock,
            minStock: p.min_stock,
            supplier: p.supplier,
            image: p.image,
        }));
    },

    saveProducts: async (products: Product[]): Promise<void> => {
        // This method is kept for compatibility but we'll use individual operations
        console.warn('saveProducts is deprecated, use addProduct/updateProduct instead');
    },

    addProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
        const { data, error } = await supabase
            .from('products')
            .insert({
                name: product.name,
                category: product.category,
                internal_code: product.internalCode,
                barcode: product.barcode,
                price_sell: product.priceSell,
                price_cost: product.priceCost,
                stock: product.stock,
                min_stock: product.minStock,
                supplier: product.supplier,
                image: product.image,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            category: data.category,
            internalCode: data.internal_code,
            barcode: data.barcode,
            priceSell: parseFloat(data.price_sell),
            priceCost: parseFloat(data.price_cost),
            stock: data.stock,
            minStock: data.min_stock,
            supplier: data.supplier,
            image: data.image,
        };
    },

    updateProduct: async (product: Product): Promise<Product> => {
        const { data, error } = await supabase
            .from('products')
            .update({
                name: product.name,
                category: product.category,
                internal_code: product.internalCode,
                barcode: product.barcode,
                price_sell: product.priceSell,
                price_cost: product.priceCost,
                stock: product.stock,
                min_stock: product.minStock,
                supplier: product.supplier,
                image: product.image,
            })
            .eq('id', product.id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            category: data.category,
            internalCode: data.internal_code,
            barcode: data.barcode,
            priceSell: parseFloat(data.price_sell),
            priceCost: parseFloat(data.price_cost),
            stock: data.stock,
            minStock: data.min_stock,
            supplier: data.supplier,
            image: data.image,
        };
    },

    deleteProduct: async (productId: string): Promise<void> => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;
    },

    // --- Sales ---
    getSales: async (): Promise<Sale[]> => {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            sessionId: s.session_id,
            userId: s.user_id,
            customerName: s.customer_name,
            customerCpf: s.customer_cpf,
            date: s.date,
            items: s.items,
            total: parseFloat(s.total),
            payments: s.payments,
        }));
    },

    getSalesBySession: async (sessionId: string): Promise<Sale[]> => {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('session_id', sessionId)
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            sessionId: s.session_id,
            userId: s.user_id,
            customerName: s.customer_name,
            customerCpf: s.customer_cpf,
            date: s.date,
            items: s.items,
            total: parseFloat(s.total),
            payments: s.payments,
        }));
    },

    saveSales: async (sales: Sale[]): Promise<void> => {
        console.warn('saveSales is deprecated, use processSale instead');
    },

    processSale: async (sale: Omit<Sale, 'id'>): Promise<boolean> => {
        try {
            // Start a transaction-like operation
            // 1. Check stock availability
            const productIds = sale.items.map(item => item.id);
            const { data: products, error: fetchError } = await supabase
                .from('products')
                .select('*')
                .in('id', productIds);

            if (fetchError) throw fetchError;

            // Check if all products have enough stock
            for (const item of sale.items) {
                const product = products?.find(p => p.id === item.id);
                if (!product || product.stock < item.quantity) {
                    return false;
                }
            }

            // 2. Insert sale
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert({
                    session_id: sale.sessionId,
                    user_id: sale.userId,
                    customer_name: sale.customerName,
                    customer_cpf: sale.customerCpf,
                    date: sale.date,
                    items: sale.items,
                    total: sale.total,
                    payments: sale.payments,
                })
                .select()
                .single();

            if (saleError) throw saleError;

            // 3. Update stock for each product
            for (const item of sale.items) {
                const product = products?.find(p => p.id === item.id);
                if (product) {
                    const { error: updateError } = await supabase
                        .from('products')
                        .update({ stock: product.stock - item.quantity })
                        .eq('id', item.id);

                    if (updateError) throw updateError;
                }
            }

            return true;
        } catch (error) {
            console.error('Error processing sale:', error);
            return false;
        }
    },

    // --- Users & Auth ---
    getUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name');

        if (error) throw error;

        return (data || []).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            passwordHash: u.password_hash,
            role: u.role,
            avatar: u.avatar,
        }));
    },

    saveUsers: async (users: User[]): Promise<void> => {
        console.warn('saveUsers is deprecated, use addUser/updateUser instead');
    },

    addUser: async (user: Omit<User, 'id'>): Promise<User> => {
        const { data, error } = await supabase
            .from('users')
            .insert({
                name: user.name,
                email: user.email,
                password_hash: user.passwordHash,
                role: user.role,
                avatar: user.avatar,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            passwordHash: data.password_hash,
            role: data.role,
            avatar: data.avatar,
        };
    },

    updateUser: async (updatedUser: User): Promise<User> => {
        const { data, error } = await supabase
            .from('users')
            .update({
                name: updatedUser.name,
                email: updatedUser.email,
                password_hash: updatedUser.passwordHash,
                role: updatedUser.role,
                avatar: updatedUser.avatar,
            })
            .eq('id', updatedUser.id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            passwordHash: data.password_hash,
            role: data.role,
            avatar: data.avatar,
        };
    },

    deleteUser: async (userId: string): Promise<void> => {
        // Com ON DELETE SET NULL aplicado no banco, não precisamos mais verificar dependências
        // Os registros de vendas e sessões serão preservados com user_id = NULL
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    },

    login: async (email: string, password: string): Promise<User | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password_hash', password)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            passwordHash: data.password_hash,
            role: data.role,
            avatar: data.avatar,
        };
    },

    // --- Cash Sessions ---
    getSessions: async (): Promise<CashSession[]> => {
        const { data, error } = await supabase
            .from('cash_sessions')
            .select('*')
            .order('opened_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            openedByUserId: s.opened_by_user_id,
            customerName: s.customer_name,
            customerCpf: s.customer_cpf,
            status: s.status,
            openedAt: s.opened_at,
            closedAt: s.closed_at,
            initialFund: parseFloat(s.initial_fund),
            reportedTotals: s.reported_totals,
        }));
    },

    getActiveSession: async (userId: string): Promise<CashSession | undefined> => {
        const { data, error } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('opened_by_user_id', userId)
            .eq('status', 'OPEN')
            .single();

        if (error || !data) return undefined;

        return {
            id: data.id,
            openedByUserId: data.opened_by_user_id,
            customerName: data.customer_name,
            customerCpf: data.customer_cpf,
            status: data.status,
            openedAt: data.opened_at,
            closedAt: data.closed_at,
            initialFund: parseFloat(data.initial_fund),
            reportedTotals: data.reported_totals,
        };
    },

    openSession: async (userId: string, initialFund: number): Promise<CashSession> => {
        const { data: sessionData, error: sessionError } = await supabase
            .from('cash_sessions')
            .insert({
                opened_by_user_id: userId,
                status: 'OPEN',
                opened_at: new Date().toISOString(),
                initial_fund: initialFund,
            })
            .select()
            .single();

        if (sessionError) throw sessionError;

        // Log opening movement
        await SupabaseService.addCashMovement({
            id: crypto.randomUUID(),
            sessionId: sessionData.id,
            type: 'OPENING',
            amount: initialFund,
            timestamp: new Date().toISOString(),
        });

        return {
            id: sessionData.id,
            openedByUserId: sessionData.opened_by_user_id,
            customerName: sessionData.customer_name,
            customerCpf: sessionData.customer_cpf,
            status: sessionData.status,
            openedAt: sessionData.opened_at,
            closedAt: sessionData.closed_at,
            initialFund: parseFloat(sessionData.initial_fund),
            reportedTotals: sessionData.reported_totals,
        };
    },

    closeSession: async (sessionId: string, reportedTotals?: any): Promise<void> => {
        const { error } = await supabase
            .from('cash_sessions')
            .update({
                status: 'CLOSED',
                closed_at: new Date().toISOString(),
                reported_totals: reportedTotals,
            })
            .eq('id', sessionId);

        if (error) throw error;
    },

    updateSessionTotals: async (sessionId: string, totals: any): Promise<void> => {
        const { error } = await supabase
            .from('cash_sessions')
            .update({ reported_totals: totals })
            .eq('id', sessionId);

        if (error) throw error;
    },

    // --- Cash Movements ---
    getMovements: async (sessionId: string): Promise<CashMovement[]> => {
        const { data, error } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('session_id', sessionId)
            .order('timestamp');

        if (error) throw error;

        return (data || []).map(m => ({
            id: m.id,
            sessionId: m.session_id,
            type: m.type,
            amount: parseFloat(m.amount),
            note: m.note,
            timestamp: m.timestamp,
        }));
    },

    addCashMovement: async (movement: CashMovement): Promise<void> => {
        const { error } = await supabase
            .from('cash_movements')
            .insert({
                id: movement.id,
                session_id: movement.sessionId,
                type: movement.type,
                amount: movement.amount,
                note: movement.note,
                timestamp: movement.timestamp,
            });

        if (error) throw error;
    },
};
