import { supabase } from './supabaseClient';
import { Product, Sale, User, CashSession, CashMovement, Tenant, SaasStats, SaasPlan, SaasInvoice, Subscription, PaymentTransaction, AuditLog, TenantGrowth, RevenueByPlan, RetentionMetrics, MrrBreakdown, StockFilters, StockMetrics, SalesMetrics, CategoryReport, ProductReport, ProductSalesReport } from '../types';



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

    deleteProduct: async (productId: string, tenantId: string): Promise<void> => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('tenant_id', tenantId); // ✅ Isolamento multi-tenant garantido

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

    deleteSale: async (saleId: string, tenantId: string): Promise<void> => {
        // Note: When deleting a sale, we should restore the stock.
        // First, get the sale details
        const { data: saleData, error: fetchError } = await supabase
            .from('sales')
            .select('*')
            .eq('id', saleId)
            .eq('tenant_id', tenantId) // ✅ Isolamento multi-tenant garantido
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

    deleteUser: async (userId: string, tenantId: string): Promise<void> => {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId)
            .eq('tenant_id', tenantId); // ✅ Isolamento multi-tenant garantido

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
                .select('status, created_at')
                .eq('id', profile.tenant_id)
                .single();

            if (tenant && tenant.status === 'suspended') {
                console.error('🚨 Tenant suspenso. Fazendo logout automático.');
                localStorage.setItem('logout_reason', 'Sua conta foi suspensa. Entre em contato com o suporte.');
                await SupabaseService.logout();
                return null;
            }

            // Grace period: Allow new tenants (< 24h) without subscription
            const tenantCreatedAt = tenant?.created_at ? new Date(tenant.created_at) : null;
            const isNewTenant = tenantCreatedAt && (Date.now() - tenantCreatedAt.getTime()) < 24 * 60 * 60 * 1000;

            if (!isNewTenant) {
                // Verificar se a assinatura está válida (apenas para tenants antigos)
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
                    // Se não tem assinatura e não é novo, bloqueia
                    console.error('🚨 Nenhuma assinatura encontrada. Bloqueando acesso.');
                    localStorage.setItem('logout_reason', 'Nenhuma assinatura ativa encontrada. Entre em contato com o suporte.');
                    await SupabaseService.logout();
                    return null;
                }
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
        // Debug
        // console.log('[Supabase] getActiveSession for user:', userId);

        if (!userId) {
            console.warn('[Supabase] getActiveSession called with empty userId');
            return undefined;
        }

        try {
            const { data, error } = await supabase
                .from('cash_sessions')
                .select('*')
                .eq('opened_by_user_id', userId)
                .eq('status', 'OPEN')
                .order('opened_at', { ascending: false })
                .limit(1)
                .maybeSingle(); // Use maybeSingle combined with limit(1) to always get distinct result

            if (error) {
                console.error('[Supabase] Error getting active session:', error);
                return undefined;
            }

            if (!data) return undefined;

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
        } catch (err) {
            console.error('[Supabase] Unexpected error in getActiveSession:', err);
            return undefined;
        }
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
            // Step 1: Sign up user with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: ownerEmail,
                password: ownerPassword,
                options: {
                    data: {
                        name: ownerName,
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

            if (tenantError) {
                // Rollback: delete auth user if tenant creation fails
                await supabase.auth.admin.deleteUser(authData.user.id);
                return { success: false, error: tenantError.message };
            }

            // Step 3: Manually insert into public.users (don't rely on trigger)
            const { error: userInsertError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: ownerEmail,
                    name: ownerName,
                    tenant_id: tenantData.id,
                    role: 'admin',
                    password_hash: 'MANAGED_BY_SUPABASE_AUTH'
                });

            if (userInsertError) {
                // If user already exists (trigger created it), just update
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        tenant_id: tenantData.id,
                        role: 'admin',
                        name: ownerName
                    })
                    .eq('id', authData.user.id);

                if (updateError) {
                    console.error('Failed to update user:', updateError);
                    return { success: false, error: 'Failed to link user to tenant' };
                }
            }

            return { success: true };

        } catch (err: any) {
            console.error('Registration error:', err);
            return { success: false, error: err.message };
        }
    },

    getTenant: async (tenantId: string): Promise<Tenant | null> => {
        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();

        if (error) {
            console.error('Error fetching tenant:', error);
            return null;
        }

        return {
            id: data.id,
            name: data.name,
            slug: data.slug,
            plan: data.plan || 'free',
            status: data.status || 'active',
            createdAt: data.created_at,
            emailNotificationsEnabled: !!data.email_notifications_enabled
        };
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
                emailNotificationsEnabled: !!t.email_notifications_enabled,
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

    updateTenantSettings: async (tenantId: string, settings: { email_notifications_enabled?: boolean }): Promise<void> => {
        const { error } = await supabase
            .from('tenants')
            .update(settings)
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
        // Usar view com métricas pré-calculadas
        const { data, error } = await supabase
            .from('saas_metrics_dashboard')
            .select('*')
            .single();

        if (error) {
            console.error('Error fetching SaaS stats from view, falling back:', error);
            // Fallback para o método antigo se a view não existir
            const { count: totalTenants } = await supabase
                .from('tenants')
                .select('*', { count: 'exact', head: true });

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count: newTenants } = await supabase
                .from('tenants')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth.toISOString());

            return {
                totalRevenue: 0,
                totalTenants: totalTenants || 0,
                newTenantsMonth: newTenants || 0,
                activeSubscriptions: 0,
            };
        }

        return {
            totalRevenue: parseFloat(data.mrr) || 0,
            totalTenants: data.total_tenants || 0,
            newTenantsMonth: data.new_tenants_month || 0,
            activeSubscriptions: data.active_subscriptions || 0,
            churnRate: parseFloat(data.churn_rate) || 0,
            ltv: parseFloat(data.ltv) || 0,
            mrr: parseFloat(data.mrr) || 0,
            arr: parseFloat(data.arr) || 0,
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
            .from('subscriptions')
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
        newPlanId: string,
        userId?: string
    ): Promise<void> => {
        // 1. Verificar se o plano existe
        const { data: newPlan, error: planError } = await supabase
            .from('saas_plans')
            .select('*')
            .eq('id', newPlanId)
            .eq('active', true)
            .single();

        if (planError || !newPlan) {
            throw new Error('Plano não encontrado ou inativo');
        }

        // 2. Buscar assinatura atual
        const { data: currentSub, error: subError } = await supabase
            .from('subscriptions')
            .select('id, plan_id, status')
            .eq('tenant_id', tenantId)
            .single();

        if (subError || !currentSub) {
            throw new Error('Assinatura não encontrada');
        }

        // 3. Verificar se não está tentando mudar para o mesmo plano
        if (currentSub.plan_id === newPlanId) {
            throw new Error('Este já é o plano atual');
        }

        // 4. Atualizar o plano
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                plan_id: newPlanId,
                updated_at: new Date().toISOString(),
            })
            .eq('tenant_id', tenantId);

        if (updateError) throw updateError;

        // 5. Criar log de auditoria (via função do banco)
        try {
            await supabase.rpc('create_audit_log', {
                p_tenant_id: tenantId,
                p_user_id: userId || null,
                p_action: 'plan_changed_manual',
                p_entity_type: 'subscription',
                p_entity_id: currentSub.id,
                p_details: {
                    old_plan_id: currentSub.plan_id,
                    new_plan_id: newPlanId,
                    new_plan_name: newPlan.name,
                    new_plan_price: newPlan.price,
                },
                p_status: 'success'
            });
        } catch (logError) {
            // Log error não deve bloquear a operação
            console.error('Erro ao criar log de auditoria:', logError);
        }
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
            paymentLink: t.payment_link,
            pixQrCode: t.pix_qr_code,
            pixQrCodeBase64: t.pix_qr_code_base64,
            pixExpiration: t.pix_expiration,
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

    // --- Audit Logs ---
    getAuditLogs: async (filters?: {
        tenantId?: string;
        userId?: string;
        action?: string;
        entityType?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<any[]> => {
        let query = supabase
            .from('audit_logs')
            .select(`
                *,
                users (name),
                tenants (name)
            `)
            .order('created_at', { ascending: false });

        if (filters?.tenantId) {
            query = query.eq('tenant_id', filters.tenantId);
        }

        if (filters?.userId) {
            query = query.eq('user_id', filters.userId);
        }

        if (filters?.action) {
            query = query.eq('action', filters.action);
        }

        if (filters?.entityType) {
            query = query.eq('entity_type', filters.entityType);
        }

        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        if (filters?.limit) {
            query = query.limit(filters.limit);
        } else {
            query = query.limit(100); // Default limit
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map((log: any) => ({
            id: log.id,
            tenantId: log.tenant_id,
            userId: log.user_id,
            action: log.action,
            entityType: log.entity_type,
            entityId: log.entity_id,
            details: log.details,
            ipAddress: log.ip_address,
            userAgent: log.user_agent,
            status: log.status,
            errorMessage: log.error_message,
            createdAt: log.created_at,
            userName: log.users?.name,
            tenantName: log.tenants?.name,
        }));
    },

    createAuditLog: async (log: {
        tenantId?: string;
        userId?: string;
        action: string;
        entityType?: string;
        entityId?: string;
        details?: Record<string, any>;
        status?: 'success' | 'failed' | 'pending';
    }): Promise<void> => {
        const { error } = await supabase.rpc('create_audit_log', {
            p_tenant_id: log.tenantId || null,
            p_user_id: log.userId || null,
            p_action: log.action,
            p_entity_type: log.entityType || null,
            p_entity_id: log.entityId || null,
            p_details: log.details || {},
            p_status: log.status || 'success'
        });

        if (error) {
            console.error('Erro ao criar audit log:', error);
            throw error;
        }
    },

    // --- Advanced Metrics ---
    getTenantGrowth: async (months: number = 6): Promise<TenantGrowth[]> => {
        const { data, error } = await supabase.rpc('get_tenant_growth', {
            p_months: months
        });

        if (error) throw error;

        return data || [];
    },

    getRevenueByPlan: async (): Promise<RevenueByPlan[]> => {
        const { data, error } = await supabase.rpc('get_revenue_by_plan');

        if (error) throw error;

        return (data || []).map((row: any) => ({
            plan_id: row.plan_id,
            plan_name: row.plan_name,
            plan_price: parseFloat(row.plan_price),
            active_subscriptions: parseInt(row.active_subscriptions),
            mrr: parseFloat(row.mrr) || 0,
            percentage: parseFloat(row.percentage) || 0,
        }));
    },

    getRetentionMetrics: async (): Promise<RetentionMetrics | null> => {
        const { data, error } = await supabase.rpc('get_retention_metrics');

        if (error) throw error;

        if (!data || data.length === 0) return null;

        const row = data[0];
        return {
            total_tenants: parseInt(row.total_tenants),
            active_tenants: parseInt(row.active_tenants),
            retention_rate: parseFloat(row.retention_rate) || 0,
            avg_subscription_days: parseFloat(row.avg_subscription_days) || 0,
        };
    },

    getMrrBreakdown: async (): Promise<MrrBreakdown | null> => {
        const { data, error } = await supabase.rpc('get_mrr_breakdown');

        if (error) throw error;

        if (!data || data.length === 0) return null;

        const row = data[0];
        return {
            mrr_total: parseFloat(row.mrr_total) || 0,
            mrr_new: parseFloat(row.mrr_new) || 0,
            mrr_expansion: parseFloat(row.mrr_expansion) || 0,
            mrr_contraction: parseFloat(row.mrr_contraction) || 0,
            mrr_churn: parseFloat(row.mrr_churn) || 0,
            net_mrr_growth: parseFloat(row.net_mrr_growth) || 0,
        };
    },

    calculateChurnRate: async (startDate?: string, endDate?: string): Promise<number> => {
        const { data, error } = await supabase.rpc('calculate_churn_rate', {
            p_start_date: startDate || null,
            p_end_date: endDate || null,
        });

        if (error) throw error;

        return parseFloat(data) || 0;
    },

    calculateLtv: async (): Promise<number> => {
        const { data, error } = await supabase.rpc('calculate_ltv');

        if (error) throw error;

        return parseFloat(data) || 0;
    },

    // --- Stock Reports ---
    getStockMetrics: async (tenantId: string, filters?: StockFilters): Promise<StockMetrics> => {
        try {
            // Get all products for the tenant
            let query = supabase
                .from('products')
                .select('*')
                .eq('tenant_id', tenantId);

            // Apply category filter if provided
            if (filters?.category) {
                query = query.eq('category', filters.category);
            }

            const { data: products, error } = await query;
            if (error) throw error;

            const totalQuantity = products?.reduce((sum, p) => sum + p.stock, 0) || 0;
            // FIX: Calculate total value using sell price (priceSell) instead of cost price
            const totalValue = products?.reduce((sum, p) => sum + (p.stock * parseFloat(p.price_sell)), 0) || 0;
            const totalProducts = products?.length || 0;
            const lowStockCount = products?.filter(p => p.stock <= p.min_stock).length || 0;
            const averageValue = totalProducts > 0 ? totalValue / totalProducts : 0;

            return {
                totalQuantity,
                totalValue,
                totalProducts,
                lowStockCount,
                averageValue,
            };
        } catch (error) {
            console.error('Error getting stock metrics:', error);
            throw error;
        }
    },

    getSalesMetrics: async (tenantId: string, filters?: StockFilters): Promise<SalesMetrics> => {
        try {
            // Get sales for the tenant
            let query = supabase
                .from('sales')
                .select('*')
                .eq('tenant_id', tenantId);

            // Apply date filters if provided
            if (filters?.startDate) {
                query = query.gte('date', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('date', filters.endDate);
            }

            const { data: sales, error } = await query;
            if (error) throw error;

            let totalQuantitySold = 0;
            let totalRevenue = 0;
            let totalCost = 0;

            sales?.forEach(sale => {
                const items = sale.items || [];
                items.forEach((item: any) => {
                    // Apply category filter if provided
                    if (!filters?.category || item.category === filters.category) {
                        totalQuantitySold += item.quantity;
                        totalRevenue += item.quantity * parseFloat(item.priceSell);
                        totalCost += item.quantity * parseFloat(item.priceCost || 0);
                    }
                });
            });

            const totalProfit = totalRevenue - totalCost;
            const totalSales = sales?.length || 0;
            const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
            const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

            return {
                totalQuantitySold,
                totalRevenue,
                totalProfit,
                totalSales,
                averageTicket,
                profitMargin,
            };
        } catch (error) {
            console.error('Error getting sales metrics:', error);
            throw error;
        }
    },

    getStockByCategory: async (tenantId: string, filters?: StockFilters): Promise<CategoryReport[]> => {
        try {
            // Get all products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('*')
                .eq('tenant_id', tenantId);

            if (productsError) throw productsError;

            // Get sales data
            let salesQuery = supabase
                .from('sales')
                .select('*')
                .eq('tenant_id', tenantId);

            if (filters?.startDate) {
                salesQuery = salesQuery.gte('date', filters.startDate);
            }
            if (filters?.endDate) {
                salesQuery = salesQuery.lte('date', filters.endDate);
            }

            const { data: sales, error: salesError } = await salesQuery;
            if (salesError) throw salesError;

            // Group by category
            const categoryMap = new Map<string, CategoryReport>();

            // Process stock data
            products?.forEach(product => {
                const category = product.category || 'Sem Categoria';
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, {
                        categoryName: category,
                        stockQuantity: 0,
                        stockValue: 0,
                        salesQuantity: 0,
                        salesRevenue: 0,
                        salesProfit: 0,
                        percentage: 0,
                    });
                }

                const report = categoryMap.get(category)!;
                report.stockQuantity += product.stock;
                report.stockValue += product.stock * parseFloat(product.price_sell);
            });

            // Process sales data
            sales?.forEach(sale => {
                const items = sale.items || [];
                items.forEach((item: any) => {
                    const category = item.category || 'Sem Categoria';
                    if (!categoryMap.has(category)) {
                        categoryMap.set(category, {
                            categoryName: category,
                            stockQuantity: 0,
                            stockValue: 0,
                            salesQuantity: 0,
                            salesRevenue: 0,
                            salesProfit: 0,
                            percentage: 0,
                        });
                    }

                    const report = categoryMap.get(category)!;
                    report.salesQuantity += item.quantity;
                    report.salesRevenue += item.quantity * parseFloat(item.priceSell);
                    report.salesProfit += item.quantity * (parseFloat(item.priceSell) - parseFloat(item.priceCost || 0));
                });
            });

            // Calculate percentages
            const totalStockValue = Array.from(categoryMap.values()).reduce((sum, r) => sum + r.stockValue, 0);
            categoryMap.forEach(report => {
                report.percentage = totalStockValue > 0 ? (report.stockValue / totalStockValue) * 100 : 0;
            });

            return Array.from(categoryMap.values()).sort((a, b) => b.stockValue - a.stockValue);
        } catch (error) {
            console.error('Error getting stock by category:', error);
            throw error;
        }
    },

    getStockByProduct: async (tenantId: string, filters?: StockFilters): Promise<ProductReport[]> => {
        try {
            // Get all products
            let productsQuery = supabase
                .from('products')
                .select('*')
                .eq('tenant_id', tenantId);

            if (filters?.category) {
                productsQuery = productsQuery.eq('category', filters.category);
            }

            const { data: products, error: productsError } = await productsQuery;
            if (productsError) throw productsError;

            // Get sales data
            let salesQuery = supabase
                .from('sales')
                .select('*')
                .eq('tenant_id', tenantId);

            if (filters?.startDate) {
                salesQuery = salesQuery.gte('date', filters.startDate);
            }
            if (filters?.endDate) {
                salesQuery = salesQuery.lte('date', filters.endDate);
            }

            const { data: sales, error: salesError } = await salesQuery;
            if (salesError) throw salesError;

            // Create product reports
            const productReports: ProductReport[] = products?.map(product => {
                let salesQuantity = 0;
                let salesRevenue = 0;

                // Calculate sales for this product
                sales?.forEach(sale => {
                    const items = sale.items || [];
                    items.forEach((item: any) => {
                        if (item.id === product.id) {
                            salesQuantity += item.quantity;
                            salesRevenue += item.quantity * parseFloat(item.priceSell);
                        }
                    });
                });

                const stockValue = product.stock * parseFloat(product.price_sell);
                const profit = salesRevenue - (salesQuantity * parseFloat(product.price_cost));
                const profitMargin = salesRevenue > 0 ? (profit / salesRevenue) * 100 : 0;

                return {
                    productId: product.id,
                    productName: product.name,
                    category: product.category || 'Sem Categoria',
                    stockQuantity: product.stock,
                    costPrice: parseFloat(product.price_cost),
                    sellPrice: parseFloat(product.price_sell),
                    stockValue,
                    salesQuantity,
                    salesRevenue,
                    profit,
                    profitMargin,
                };
            }) || [];

            return productReports.sort((a, b) => b.stockValue - a.stockValue);
        } catch (error) {
            console.error('Error getting stock by product:', error);
            throw error;
        }
    },

    getTopSellingProducts: async (tenantId: string, filters?: StockFilters, limit: number = 10): Promise<ProductSalesReport[]> => {
        try {
            // Get sales data
            let salesQuery = supabase
                .from('sales')
                .select('*')
                .eq('tenant_id', tenantId);

            if (filters?.startDate) {
                salesQuery = salesQuery.gte('date', filters.startDate);
            }
            if (filters?.endDate) {
                salesQuery = salesQuery.lte('date', filters.endDate);
            }

            const { data: sales, error: salesError } = await salesQuery;
            if (salesError) throw salesError;

            // Aggregate sales by product
            const productSalesMap = new Map<string, ProductSalesReport>();

            sales?.forEach(sale => {
                const items = sale.items || [];
                items.forEach((item: any) => {
                    // Apply category filter if provided
                    if (filters?.category && item.category !== filters.category) {
                        return;
                    }

                    if (!productSalesMap.has(item.id)) {
                        productSalesMap.set(item.id, {
                            productId: item.id,
                            productName: item.name,
                            category: item.category || 'Sem Categoria',
                            quantitySold: 0,
                            revenue: 0,
                            profit: 0,
                            profitMargin: 0,
                        });
                    }

                    const report = productSalesMap.get(item.id)!;
                    const itemRevenue = item.quantity * parseFloat(item.priceSell);
                    const itemCost = item.quantity * parseFloat(item.priceCost || 0);

                    report.quantitySold += item.quantity;
                    report.revenue += itemRevenue;
                    report.profit += (itemRevenue - itemCost);
                });
            });

            // Calculate profit margins
            productSalesMap.forEach(report => {
                report.profitMargin = report.revenue > 0 ? (report.profit / report.revenue) * 100 : 0;
            });

            // Sort by quantity sold and limit
            return Array.from(productSalesMap.values())
                .sort((a, b) => b.quantitySold - a.quantitySold)
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting top selling products:', error);
            throw error;
        }
    },
};
