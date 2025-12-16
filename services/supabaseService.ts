import { supabase } from './supabaseClient';
import { Product, Sale, User, CashSession, CashMovement, Tenant, SaasStats, SaasPlan, SaasInvoice, Subscription, PaymentTransaction } from '../types';

export const SupabaseService = {
    // --- Products ---
    getProducts: async (tenantId: string): Promise<Product[]> => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');

        if (error) throw error;

        // Map database fields to app types
        return (data || []).map(p => ({
            id: p.id,
            tenantId: p.tenant_id,
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

    addProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
        const { data, error } = await supabase
            .from('products')
            .insert({
                tenant_id: product.tenantId,
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
            tenantId: data.tenant_id,
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
            .eq('tenant_id', product.tenantId) // Security check
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            tenantId: data.tenant_id,
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
        // Note: For extra safety we should also check tenant_id, 
        // but typically the ID is unique enough. 
        // Adding tenant_id check requires passing it to this function.

        if (error) throw error;
    },

    // --- Sales ---
    getSales: async (tenantId: string): Promise<Sale[]> => {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            tenantId: s.tenant_id,
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
            tenantId: s.tenant_id,
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

    processSale: async (sale: Omit<Sale, 'id'>): Promise<boolean> => {
        try {
            // Start a transaction-like operation
            // 1. Check stock availability
            const productIds = sale.items.map(item => item.id);
            const { data: products, error: fetchError } = await supabase
                .from('products')
                .select('*')
                .eq('tenant_id', sale.tenantId)
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
                    tenant_id: sale.tenantId,
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
                        .eq('id', item.id)
                        .eq('tenant_id', sale.tenantId);

                    if (updateError) throw updateError;
                }
            }

            return true;
        } catch (error) {
            console.error('Error processing sale:', error);
            return false;
        }
    },

    deleteSale: async (saleId: string): Promise<void> => {
        // Note: When deleting a sale, we should restore the stock.
        // First, get the sale details
        const { data: saleData, error: fetchError } = await supabase
            .from('sales')
            .select('*')
            .eq('id', saleId)
            .single();

        if (fetchError) throw fetchError;

        if (saleData) {
            // Restore stock for each item
            for (const item of saleData.items) {
                const { data: product } = await supabase
                    .from('products')
                    .select('stock')
                    .eq('id', item.id)
                    .eq('tenant_id', saleData.tenant_id)
                    .single();

                if (product) {
                    await supabase
                        .from('products')
                        .update({ stock: product.stock + item.quantity })
                        .eq('id', item.id)
                        .eq('tenant_id', saleData.tenant_id);
                }
            }
        }

        // Delete the sale
        const { error } = await supabase
            .from('sales')
            .delete()
            .eq('id', saleId);

        if (error) throw error;
    },


    // --- Users & Auth ---
    getUsers: async (tenantId: string): Promise<User[]> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');

        if (error) throw error;

        return (data || []).map(u => ({
            id: u.id,
            tenantId: u.tenant_id,
            name: u.name,
            email: u.email,
            passwordHash: u.password_hash,
            role: u.role,
            avatar: u.avatar,
        }));
    },

    addUser: async (user: Omit<User, 'id'>): Promise<User> => {
        const { data, error } = await supabase
            .from('users')
            .insert({
                tenant_id: user.tenantId,
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
            tenantId: data.tenant_id,
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
            .eq('tenant_id', updatedUser.tenantId)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            tenantId: data.tenant_id,
            name: data.name,
            email: data.email,
            passwordHash: data.password_hash,
            role: data.role,
            avatar: data.avatar,
        };
    },

    deleteUser: async (userId: string): Promise<void> => {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    },

    login: async (email: string, password: string): Promise<User | null> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Error logging in:', error.message);
                return null;
            }

            if (data.user) {
                // Fetch full profile from public.users and check tenant status
                const userProfile = await SupabaseService.getCurrentUser();
                if (!userProfile) { // Check failed (e.g. suspended)
                    return null;
                }
                return userProfile;
            }
            return null;
        } catch (error) {
            console.error('Unexpected error during login:', error);
            return null;
        }
    },

    logout: async (): Promise<void> => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error);
    },

    getCurrentUser: async (): Promise<User | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error || !profile) {
            // If profile is missing but auth exists (edge case), try to use metadata or return null
            console.warn('Profile not found for authenticated user:', error);
            return null;
        }

        // Verificar se o tenant está suspenso (apenas para não-super-admins)
        if (profile.tenant_id && profile.role !== 'super_admin') {
            const { data: tenant } = await supabase
                .from('tenants')
                .select('status')
                .eq('id', profile.tenant_id)
                .single();

            if (tenant && tenant.status === 'suspended') {
                console.error('🚨 Tenant suspenso. Fazendo logout automático.');
                localStorage.setItem('logout_reason', 'Sua conta foi suspensa. Entre em contato com o suporte.');
                await SupabaseService.logout();
                return null;
            }

            // Verificar se a assinatura está válida
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('status, trial_ends_at, expires_at')
                .eq('tenant_id', profile.tenant_id)
                .single();

            if (subscription) {
                const now = new Date();
                let subscriptionInvalid = false;
                let reason = '';

                // Verificar se está cancelada ou expirada
                if (subscription.status === 'cancelled') {
                    subscriptionInvalid = true;
                    reason = 'Sua assinatura foi cancelada. Renove para continuar usando o sistema.';
                } else if (subscription.status === 'expired') {
                    subscriptionInvalid = true;
                    reason = 'Sua assinatura expirou. Renove para continuar usando o sistema.';
                }
                // Verificar se trial expirou
                else if (subscription.status === 'trial' && subscription.trial_ends_at) {
                    const trialEnd = new Date(subscription.trial_ends_at);
                    if (trialEnd < now) {
                        subscriptionInvalid = true;
                        reason = 'Seu período de teste expirou. Assine um plano para continuar.';
                    }
                }
                // Verificar se assinatura ativa expirou
                else if (subscription.status === 'active' && subscription.expires_at) {
                    const expireDate = new Date(subscription.expires_at);
                    if (expireDate < now) {
                        subscriptionInvalid = true;
                        reason = 'Sua assinatura expirou. Renove para continuar usando o sistema.';
                    }
                }

                if (subscriptionInvalid) {
                    console.error(`🚨 ${reason}`);
                    localStorage.setItem('logout_reason', reason);
                    await SupabaseService.logout();
                    return null;
                }
            } else {
                // Se não tem assinatura, bloqueia também
                console.error('🚨 Nenhuma assinatura encontrada. Bloqueando acesso.');
                localStorage.setItem('logout_reason', 'Nenhuma assinatura ativa encontrada. Entre em contato com o suporte.');
                await SupabaseService.logout();
                return null;
            }
        }

        return {
            id: profile.id,
            tenantId: profile.tenant_id,
            name: profile.name,
            email: profile.email,
            passwordHash: '', // Never return hash
            role: profile.role as 'admin' | 'operator' | 'super_admin',
            avatar: profile.avatar,
        };
    },


    // --- Cash Sessions ---
    getSessions: async (tenantId: string): Promise<CashSession[]> => {
        const { data, error } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('opened_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            tenantId: s.tenant_id,
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
            tenantId: data.tenant_id,
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

    openSession: async (userId: string, tenantId: string, initialFund: number): Promise<CashSession> => {
        const { data: sessionData, error: sessionError } = await supabase
            .from('cash_sessions')
            .insert({
                tenant_id: tenantId,
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
            tenantId: tenantId,
            sessionId: sessionData.id,
            type: 'OPENING',
            amount: initialFund,
            timestamp: new Date().toISOString(),
        });

        return {
            id: sessionData.id,
            tenantId: sessionData.tenant_id,
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
            tenantId: m.tenant_id,
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
                tenant_id: movement.tenantId,
                session_id: movement.sessionId,
                type: movement.type,
                amount: movement.amount,
                note: movement.note,
                timestamp: movement.timestamp,
            });

        if (error) throw error;
    },

    registerTenant: async (
        ownerName: string,
        ownerEmail: string,
        ownerPassword: string,
        companyName: string
    ): Promise<{ success: boolean; error?: string }> => {
        // Generate slug from company name
        const companySlug = companyName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        try {
            // 1. Create Tenant (public table) - needs to happen first or via RPC? 
            // Better to use the RPC if it works, BUT RPC 'register_tenant' was for custom users.
            // We need a NEW registration flow that uses Supabase Auth.

            // NOTE: Standard flow is: 
            // 1. User Sign Up -> auth.users
            // 2. Trigger -> public.users
            // 3. User creates Tenant? 

            // To simplify, we will stick with `register_tenant` RPC but we need to update it 
            // OR use a client-side multi-step process.
            // Given the existing RPC does custom user insert, we SHOULD use client-side sign up.

            // Step 1: Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: ownerEmail,
                password: ownerPassword,
                options: {
                    data: {
                        name: ownerName,
                        role: 'admin', // Owner is admin
                        // we don't have tenantId yet, it will be null initially? 
                        // Or we need to create tenant first?
                    }
                }
            });

            if (authError) return { success: false, error: authError.message };
            if (!authData.user) return { success: false, error: 'User creation failed' };

            // Step 2: Create Tenant
            const { data: tenantData, error: tenantError } = await supabase
                .from('tenants')
                .insert({
                    name: companyName,
                    slug: companySlug,
                    plan: 'free',
                    status: 'active'
                })
                .select()
                .single();

            if (tenantError) return { success: false, error: tenantError.message };

            // Step 3: Update user with tenantId
            // The trigger might have already run. We update the profile.
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    tenant_id: tenantData.id,
                    role: 'admin'
                })
                .eq('id', authData.user.id);

            if (updateError) return { success: false, error: updateError.message };

            return { success: true };

        } catch (err: any) {
            console.error('Registration error:', err);
            return { success: false, error: err.message };
        }
    },

    // --- SaaS Admin ---
    getTenants: async (): Promise<Tenant[]> => {
        // Query to get tenants with their owner info
        // Note: This assumes a relationship or we fetch users separately.
        // For now, fetching tenants simply.
        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch owners for these tenants (assuming users table has tenant_id)
        // This is a bit inefficient but works for smaller lists.
        // A better way would be a join if configured in DB.
        const tenants: Tenant[] = await Promise.all((data || []).map(async (t) => {
            const { data: owner } = await supabase
                .from('users')
                .select('name, email')
                .eq('tenant_id', t.id)
                .eq('role', 'admin') // Assuming admin is the owner
                .limit(1)
                .maybeSingle();

            return {
                id: t.id,
                name: t.name,
                slug: t.slug,
                plan: t.plan || 'free',
                status: t.status || 'active',
                createdAt: t.created_at,
                ownerName: owner?.name,
                ownerEmail: owner?.email,
            };
        }));

        return tenants;
    },

    updateTenantStatus: async (tenantId: string, status: 'active' | 'suspended'): Promise<void> => {
        const { error } = await supabase
            .from('tenants')
            .update({ status })
            .eq('id', tenantId);

        if (error) throw error;
    },

    deleteTenant: async (tenantId: string): Promise<void> => {
        const { error } = await supabase
            .from('tenants')
            .delete()
            .eq('id', tenantId);

        if (error) throw error;
    },

    getSaaSStats: async (): Promise<SaasStats> => {
        // Get total tenants
        const { count: totalTenants, error: tenantError } = await supabase
            .from('tenants')
            .select('*', { count: 'exact', head: true });

        if (tenantError) throw tenantError;

        // Get new tenants this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: newTenants, error: newTenantError } = await supabase
            .from('tenants')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth.toISOString());

        if (newTenantError) throw newTenantError;

        return {
            totalRevenue: 0, // Not implemented yet
            totalTenants: totalTenants || 0,
            newTenantsMonth: newTenants || 0,
            activeSubscriptions: 0, // Not implemented yet
        };
    },

    // --- Plans Management ---
    getPlans: async (): Promise<SaasPlan[]> => {
        const { data, error } = await supabase
            .from('saas_plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: parseFloat(p.price),
            limits: p.limits || {},
            features: p.features || [],
            active: p.active ?? true,
        }));
    },

    createPlan: async (plan: Omit<SaasPlan, 'id'>): Promise<SaasPlan> => {
        const { data, error } = await supabase
            .from('saas_plans')
            .insert({
                name: plan.name,
                slug: plan.slug,
                description: plan.description,
                price: plan.price,
                limits: plan.limits,
                features: plan.features,
                active: plan.active,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            price: parseFloat(data.price),
            limits: data.limits || {},
            features: data.features || [],
            active: data.active ?? true,
        };
    },

    updatePlan: async (plan: SaasPlan): Promise<SaasPlan> => {
        const { data, error } = await supabase
            .from('saas_plans')
            .update({
                name: plan.name,
                slug: plan.slug,
                description: plan.description,
                price: plan.price,
                limits: plan.limits,
                features: plan.features,
                active: plan.active,
            })
            .eq('id', plan.id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            price: parseFloat(data.price),
            limits: data.limits || {},
            features: data.features || [],
            active: data.active ?? true,
        };
    },

    deletePlan: async (planId: string): Promise<void> => {
        const { error } = await supabase
            .from('saas_plans')
            .delete()
            .eq('id', planId);

        if (error) throw error;
    },

    // --- Financial ---
    getInvoices: async (): Promise<SaasInvoice[]> => {
        const { data, error } = await supabase
            .from('saas_invoices')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(inv => ({
            id: inv.id,
            tenantId: inv.tenant_id,
            amount: parseFloat(inv.amount),
            status: inv.status,
            invoiceUrl: inv.invoice_url,
            dueDate: inv.due_date,
            paidAt: inv.paid_at,
            createdAt: inv.created_at,
        }));
    },

    getRevenueStats: async (): Promise<{ mrr: number; arr: number }> => {
        // Calculate MRR from active subscriptions
        const { data: subscriptions, error } = await supabase
            .from('saas_subscriptions')
            .select('plan_id, saas_plans(price)')
            .eq('status', 'active');

        if (error) throw error;

        const mrr = (subscriptions || []).reduce((sum, sub: any) => {
            return sum + (parseFloat(sub.saas_plans?.price) || 0);
        }, 0);

        return {
            mrr,
            arr: mrr * 12,
        };
    },

    // --- Subscription Management ---
    getSubscription: async (tenantId: string): Promise<Subscription | null> => {
        const { data, error } = await supabase
            .from('tenant_subscriptions_view')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }

        if (!data) return null;

        return {
            id: data.subscription_id,
            tenantId: data.tenant_id,
            planId: data.plan_id,
            status: data.subscription_status,
            startedAt: data.started_at,
            trialEndsAt: data.trial_ends_at,
            expiresAt: data.expires_at,
            cancelledAt: data.cancelled_at,
            autoRenew: data.auto_renew,
            planName: data.plan_name,
            planPrice: parseFloat(data.plan_price),
            planLimits: data.plan_limits || {},
            planFeatures: data.plan_features || [],
        };
    },

    createSubscription: async (
        tenantId: string,
        planId: string,
        trialDays: number = 7
    ): Promise<Subscription> => {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

        const { data, error } = await supabase
            .from('subscriptions')
            .insert({
                tenant_id: tenantId,
                plan_id: planId,
                status: 'trial',
                trial_ends_at: trialEndsAt.toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            tenantId: data.tenant_id,
            planId: data.plan_id,
            status: data.status,
            startedAt: data.started_at,
            trialEndsAt: data.trial_ends_at,
            expiresAt: data.expires_at,
            cancelledAt: data.cancelled_at,
            autoRenew: data.auto_renew,
        };
    },

    activateSubscription: async (
        tenantId: string,
        durationMonths: number = 1
    ): Promise<void> => {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

        const { error } = await supabase
            .from('subscriptions')
            .update({
                status: 'active',
                expires_at: expiresAt.toISOString(),
            })
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    updateSubscriptionPlan: async (
        tenantId: string,
        newPlanId: string
    ): Promise<void> => {
        const { error } = await supabase
            .from('subscriptions')
            .update({
                plan_id: newPlanId,
            })
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    cancelSubscription: async (tenantId: string): Promise<void> => {
        const { error } = await supabase
            .from('subscriptions')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
            })
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    renewSubscription: async (
        tenantId: string,
        durationMonths: number = 1
    ): Promise<void> => {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

        const { error } = await supabase
            .from('subscriptions')
            .update({
                status: 'active',
                expires_at: expiresAt.toISOString(),
            })
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    extendTrial: async (tenantId: string, additionalDays: number): Promise<void> => {
        // Get current trial_ends_at
        const { data: current } = await supabase
            .from('subscriptions')
            .select('trial_ends_at')
            .eq('tenant_id', tenantId)
            .single();

        const newTrialEnd = current?.trial_ends_at
            ? new Date(current.trial_ends_at)
            : new Date();

        newTrialEnd.setDate(newTrialEnd.getDate() + additionalDays);

        const { error } = await supabase
            .from('subscriptions')
            .update({
                trial_ends_at: newTrialEnd.toISOString(),
            })
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    // --- Payment Methods ---
    createPayment: async (
        tenantId: string,
        planId: string,
        subscriptionId?: string
    ): Promise<{ paymentLink: string; transactionId: string }> => {
        // Chamar Edge Function para criar preferência no MP
        const { data, error } = await supabase.functions.invoke('create-mp-payment', {
            body: {
                tenantId,
                planId,
                subscriptionId,
            },
        });

        if (error) throw error;

        return {
            paymentLink: data.paymentLink,
            transactionId: data.transactionId,
        };
    },

    getPaymentTransactions: async (tenantId: string): Promise<PaymentTransaction[]> => {
        const { data, error } = await supabase
            .from('tenant_payments_view')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(t => ({
            id: t.transaction_id,
            tenantId: t.tenant_id,
            subscriptionId: t.subscription_id,
            planId: t.plan_id,
            amount: parseFloat(t.amount),
            currency: t.currency,
            status: t.status,
            mpPaymentType: t.mp_payment_type,
            mpPaymentMethod: t.mp_payment_method,
            description: t.description,
            createdAt: t.created_at,
            paidAt: t.paid_at,
            expiresAt: t.expires_at,
            tenantName: t.tenant_name,
            planName: t.plan_name,
            planPrice: t.plan_price,
        }));
    },

    getPaymentTransaction: async (transactionId: string): Promise<PaymentTransaction | null> => {
        const { data, error } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return {
            id: data.id,
            tenantId: data.tenant_id,
            subscriptionId: data.subscription_id,
            planId: data.plan_id,
            amount: parseFloat(data.amount),
            currency: data.currency,
            status: data.status,
            mpPreferenceId: data.mp_preference_id,
            mpPaymentId: data.mp_payment_id,
            mpPaymentType: data.mp_payment_type,
            mpPaymentMethod: data.mp_payment_method,
            description: data.description,
            paymentLink: data.payment_link,
            pixQrCode: data.pix_qr_code,
            pixQrCodeBase64: data.pix_qr_code_base64,
            pixExpiration: data.pix_expiration,
            createdAt: data.created_at,
            paidAt: data.paid_at,
            expiresAt: data.expires_at,
        };
    },
};
