-- ============================================
-- GESTOR PRO - SETUP DO BANCO DE DADOS SUPABASE
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para criar todas as tabelas e dados iniciais
-- ============================================

-- 1. CRIAR TABELAS
-- ============================================

-- Tabela de Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  internal_code TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE NOT NULL,
  price_sell DECIMAL(10,2) NOT NULL,
  price_cost DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  supplier TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Sessões de Caixa
CREATE TABLE cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by_user_id UUID REFERENCES users(id) NOT NULL,
  customer_name TEXT,
  customer_cpf TEXT,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  initial_fund DECIMAL(10,2) NOT NULL,
  reported_totals JSONB
);

-- Tabela de Vendas
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES cash_sessions(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_cpf TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payments JSONB NOT NULL
);

-- Tabela de Movimentações de Caixa
CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES cash_sessions(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('OPENING', 'ADD_FUND', 'WITHDRAW', 'CLOSING')),
  amount DECIMAL(10,2) NOT NULL,
  note TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRIAR ÍNDICES
-- ============================================

CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_session_id ON sales(session_id);
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_cash_sessions_user_id ON cash_sessions(opened_by_user_id);
CREATE INDEX idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX idx_cash_movements_session_id ON cash_movements(session_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_barcode ON products(barcode);

-- 3. CRIAR TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para autenticação via anon key
-- NOTA: Em produção, ajuste estas políticas conforme suas necessidades de segurança
CREATE POLICY "Enable all for anon" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON products FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON sales FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON cash_sessions FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON cash_movements FOR ALL USING (true);

-- 5. INSERIR DADOS INICIAIS
-- ============================================

-- Inserir usuários padrão
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Administrador', 'vinvanwan.abril@gmail.com', '123456', 'admin'),
  ('Operador de Caixa', 'operador@test.com', '123456', 'operator');

-- Inserir produtos de exemplo
INSERT INTO products (name, category, internal_code, barcode, price_sell, price_cost, stock, min_stock, supplier, image) VALUES
  ('Refrigerante Cola 350ml', 'Bebidas', 'BEB001', '7890001', 5.50, 2.50, 50, 10, 'Distribuidora Central', 'https://picsum.photos/200'),
  ('Batata Chips 100g', 'Snacks', 'SNK001', '7890002', 8.90, 4.00, 8, 15, 'Snacks SA', 'https://picsum.photos/201'),
  ('Água Mineral 500ml', 'Bebidas', 'BEB002', '7890003', 3.00, 0.80, 120, 20, 'Distribuidora Central', 'https://picsum.photos/202');

-- ============================================
-- SETUP COMPLETO!
-- ============================================
-- Próximos passos:
-- 1. Copie sua SUPABASE_URL e SUPABASE_ANON_KEY
-- 2. Configure o arquivo .env.local
-- 3. Execute: npm install @supabase/supabase-js
-- ============================================
