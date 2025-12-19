-- Atualizar a view de pagamentos para incluir campos de PIX e Link de Pagamento
CREATE OR REPLACE VIEW public.tenant_payments_view AS
SELECT 
    pt.id as transaction_id,
    pt.tenant_id,
    pt.subscription_id,
    pt.plan_id,
    pt.amount,
    pt.currency,
    pt.status,
    pt.mp_payment_type,
    pt.mp_payment_method,
    pt.description,
    pt.payment_link,
    pt.pix_qr_code,
    pt.pix_qr_code_base64,
    pt.pix_expiration,
    pt.created_at,
    pt.paid_at,
    pt.expires_at,
    t.name as tenant_name,
    p.name as plan_name,
    p.price as plan_price
FROM public.payment_transactions pt
LEFT JOIN public.tenants t ON pt.tenant_id = t.id
LEFT JOIN public.saas_plans p ON pt.plan_id = p.id
ORDER BY pt.created_at DESC;
