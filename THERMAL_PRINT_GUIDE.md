# 🖨️ Guia de Impressão Térmica - GESTOR PRO

## ✅ MELHORIAS IMPLEMENTADAS!

O sistema de impressão térmica foi **significativamente melhorado** com as seguintes funcionalidades:

---

## 🎯 **Recursos Implementados:**

### **1. Suporte Multi-Tamanho** 📏
- ✅ **58mm** - Papel compacto (impressoras pequenas)
- ✅ **80mm** - Papel padrão (maioria das térmicas)
- ✅ Auto-ajuste de layout por tamanho
- ✅ Fontes responsivas

### **2. QR Codes** 📱
- ✅ QR Code com ID da venda
- ✅ Posicionamento otimizado
- ✅ Tamanho 120x120px
- ✅ Opcional (pode desativar)

### **3. Configurações Personalizáveis** ⚙️
```typescript
{
  paperWidth: '58mm' | '80mm',      // Largura do papel
  showLogo: boolean,                 // Exibir cabeçalho da loja
  showQRCode: boolean,               // Incluir QR Code
  fontSize: 'small' | 'normal' | 'large',  // Tamanho da fonte
  autoCut: boolean,                  // Marcador de corte
  storeName: string,                 // Nome da loja
  storeAddress: string,              // Endereço
  storePhone: string,                // Telefone
  storeCNPJ: string                  // CNPJ
}
```

### **4. Templates Otimizados** 🎨
- ✅ Layout monoespaçado (Courier New)
- ✅ Margens corretas para térmicas
- ✅ Divisores com bordas tracejadas
- ✅ Seções bem definidas
- ✅ Total destacado

### **5. Integração Completa** 🔗
- ✅ Botão no modal de sucesso de venda
- ✅ Configurações salvas em localStorage
- ✅ Modal de configuração dedicado
- ✅ Teste de impressão

---

## 📋 **Arquivos Criados:**

### **1. `thermalPrintService.ts`** 💾
**Serviço principal de impressão**

Funções principais:
- `printReceipt(sale)` - Imprime comprovante de venda
- `printBarcodeLabel(product)` - Imprime etiqueta de código de barras  
- `generateQRCode(text)` - Gera QR Code
- `saveConfig(config)` - Salva configurações
- `loadConfig()` - Carrega configurações

### **2. `PrinterSettingsModal.tsx`** 🎨
**Modal de configuração**

Recursos:
- Seleção de tamanho de papel (58mm/80mm)
- Escolha de tamanho de fonte  
- Opções de QR Code e logo
- Configuração da loja
- Botão de teste de impressão

### **3. `THERMAL_PRINT_GUIDE.md`** 📖
**Este documento!**

---

## 🚀 **Como Usar:**

### **Opção 1: Imprimir Comprovante de Venda**

1. Finalize uma venda no PDV
2. No modal de sucesso, clique em **"Compartilhar Comprovante"**
3. Clique em **"Impressora Térmica"** (botão roxo)
4. Comprovante será enviado para impressão!

### **Opção 2: Configurar Impressora**

1. **Ainda não há botão visível no menu** (próxima etapa)
2. Por enquanto, as configurações são carregadas assim:
   - Padrão: 80mm, fonte normal, QR ativado
   - Salvo automaticamente no navegador

### **Opção 3: Imprimir Etiqueta de Produto**

O serviço já está pronto:
```typescript
import { ThermalPrintService } from './services/thermalPrintService';

ThermalPrintService.printBarcodeLabel({
  name: 'Produto Exemplo',
  barcode: '7891234567890',
  priceSell: 19.90
});
```

---

## 📐 **Layouts de Impressão:**

### **Comprovante 80mm:**
```
┌─────────────────────────────────┐
│         GESTOR PRO              │ ← Nome da loja
│  Rua Exemplo, 123 - Centro      │ ← Endereço
│    Tel: (11) 98765-4321         │ ← Telefone
│   CNPJ: 00.000.000/0001-00      │ ← CNPJ
├═══════ ════════════════════════┤
│   COMPROVANTE DE VENDA          │
├─────────────────────────────────┤
│ Data: 10/12/2025                │
│ Hora: 20:45:30                  │
│ Cliente: João Silva             │
│ CPF: 123.456.789-00             │
│ Venda: #12345                   │
├─────────────────────────────────┤
│ ITENS DA COMPRA                 │
├─────────────────────────────────┤
│ Coca Cola 350ml                 │
│ 2x R$ 5.00          R$ 10.00    │
│                                 │
│ Pão Frances                     │
│ 3x R$ 1.50          R$ 4.50     │
├─────────────────────────────────┤
│ FORMA DE PAGAMENTO              │
├─────────────────────────────────┤
│ PIX                 R$ 14.50    │
├═════════════════════════════════┤
│        TOTAL       R$ 14.50     │
├═════════════════════════════════┤
│                                 │
│        [QR CODE]                │
│      Código da Venda            │
│                                 │
├─────────────────────────────────┤
│    Obrigado pela preferência!   │
│         Volte sempre!           │
│   www.gestorpro.com.br          │
└─────────────────────────────────┘
```

### **Comprovante 58mm:**
```
┌──────────────────────┐
│    GESTOR PRO        │
│  Rua Exemplo, 123    │
│    (11) 98765-4321   │
│  00.000.000/0001-00  │
├══════════════════════┤
│ COMPROVANTE DE VENDA │
├──────────────────────┤
│ Data: 10/12/2025     │
│ Hora: 20:45:30       │
│ Cliente: João Silva  │
│ Venda: #12345        │
├──────────────────────┤
│ ITENS                │
├──────────────────────┤
│ Coca Cola 350ml      │
│ 2x R$ 5.00  R$ 10.00 │
├──────────────────────┤
│ PAGAMENTO            │
├──────────────────────┤
│ PIX        R$ 14.50  │
├══════════════════════┤
│ TOTAL     R$ 14.50   │
├══════════════════════┤
│     [QR CODE]        │
├──────────────────────┤
│ Obrigado! Volte!     │
└──────────────────────┘
```

---

## ⚙️ **Configurações Padrão:**

```typescript
{
  paperWidth: '80mm',           // Papel padrão
  showLogo: true,               // Mostra cabeçalho
  showQRCode: true,             // Inclui QR Code
  fontSize: 'normal',           // Fonte média
  autoCut: true,                // Marca separação
  storeName: 'GESTOR PRO',
  storeAddress: 'Rua Exemplo, 123 - Centro',
  storePhone: '(11) 98765-4321',
  storeCNPJ: '00.000.000/0001-00'
}
```

---

## 🔧 **Como Personalizar:**

### **1. Via Modal (quando integrado):**
```
Dashboard → Configurações → Impressora
```

### **2. Via Código:**
```typescript
import { ThermalPrintService } from './services/thermalPrintService';

ThermalPrintService.saveConfig({
  paperWidth: '58mm',
  fontSize: 'small',
  showQRCode: false,
  storeName: 'Minha Loja'
});
```

---

## 🖨️ **Tipos de Impressoras Suportadas:**

### **Compatíveis:**
- ✅ Impressoras térmicas 58mm
- ✅ Impressoras térmicas 80mm
- ✅ Impressoras não-fiscais
- ✅ Qualquer impressora conectada ao Windows

### **Como Funciona:**
```
1. Usuário clica em "Impressora Térmica"
2. HTML otimizado é gerado
3. window.print() é chamado
4. Navegador abre diálogo de impressão
5. Seleciona impressora térmica
6. Imprime!
```

> **Nota:** Ainda usa `window.print()` do navegador, então:
> - ✅ Requer seleção manual da impressora
> - ❌ Não é totalmente silenciosa
> - ❌ Não envia comandos ESC/POS diretos

---

## 📱 **QR Codes:**

### **Informações no QR:**
```
Formato: VENDA:{ID_DA_VENDA}
Exemplo: VENDA:1733877600000
```

### **Usos Possíveis:**
- 🔍 Rastreamento de venda
- 📱 App mobile para consulta
- 🌐 Link para comprovante online (futuro)
- ✅ Validação de autenticidade

---

## ⚠️ **Limitações Atuais:**

### **1. Requer Confirmação:**
```
❌ Não é impressão silenciosa
✅ Usuário precisa clicar "Imprimir"
```

### **2. Configuração da Impressora:**
```
⚠️ Usuário deve configurar:
- Tamanho do papel correto
- Margens zeradas
- Orientação retrato
```

### **3. Sem Comandos ESC/POS:**
```
❌ Não abre gaveta automaticamente
❌ Não corta papel automaticamente
❌ Não controla guilhotina
```

---

## 🚀 **Próximos Passos (Futuro):**

### **Fase 2: Integração Real (1 semana)**
```
1. Backend Node.js
2. Biblioteca node-thermal-printer
3. Comandos ESC/POS diretos
4. Impressão USB/Serial
5. Impressão silenciosa real
6. Abertura de gaveta
7. Corte automático
```

### **Fase 3: App Desktop (1 mês)**
```
1. Migrar para Electron
2. Acesso direto ao hardware
3. Configurações de impressora
4. Módulo fiscal (NF-e/NFC-e)
```

---

## 🧪 **Como Testar:**

### **Teste 1: Impressão Básica**
```
1. Faça uma venda no PDV
2. Clique "Compartilhar Comprovante"
3. Clique "Impressora Térmica"
4. Diálogo de impressão abre
5. Selecione impressora térmica
6. Visualize preview
7. Clique "Imprimir"
```

### **Teste 2: Diferentes Tamanhos**
```
1. Configure para 58mm
2. Imprima teste
3. Configure para 80mm
4. Imprima teste
5. Compare resultados
```

### **Teste 3: QR Code**
```
1. Ative QR Code nas configurações
2. Imprima comprovante
3. Escaneie o QR Code com celular
4. Deve mostrar: "VENDA:{ID}"
```

---

## 💡 **Dicas de Uso:**

### **Para Papel 58mm:**
```
✅ Use fontSize: 'small'
✅ Desative showLogo se nome muito longo
✅ QR Code fica menor automaticamente
```

### **Para Papel 80mm:**
```
✅ Use fontSize: 'normal' ou 'large'
✅ Deixe showLogo ativado
✅ QR Code fica bem posicionado
```

### **Configurando Impressora no Windows:**
```
1. Painel de Controle → Dispositivos e Impressoras
2. Clique direito na térmica → "Preferências de impressão"
3. Defina:
   - Tamanho: 80mm x Contínuo (ou 58mm)
   - Margens: 0mm
   - Orientação: Retrato
4. Salve como padrão
```

---

## 📞 **Solução de Problemas:**

### **Problema: Comprovante cortado**
```
Solução: Configure margens da impressora para 0mm
```

### **Problema: Fonte muito pequena/grande**
```
Solução: Ajuste fontSize nas configurações
```

### **Problema: QR Code não aparece**
```
Solução: Verifique se showQRCode está true
```

### **Problema: Layout quebrado**
```
Solução: Verifique paperWidth corresponde ao papel real
```

---

## 🎉 **STATUS:**

### **✅ Implementado:**
- Template 80mm completo
- Template 58mm completo
- QR Codes funcionando
- Configurações personalizáveis
- Integração no modal de venda
- Serviço de impressão
- Geração de etiquetas

### **⏳ Próxima Etapa:**
- Adicionar botão de configurações no Dashboard
- Integrar PrinterSettingsModal no App
- Atualizar Inventory para usar novo serviço

---

**🖨️ Sistema de Impressão Térmica Pronto para Uso!**

Desenvolvido para GESTOR PRO v3.0  
Data: Dezembro 2025
