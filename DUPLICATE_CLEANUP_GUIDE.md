# Sistema de Detecção e Limpeza de Duplicatas

## 📋 Visão Geral

Sistema inteligente para identificar, analisar e remover vendas duplicadas no banco de dados, garantindo a integridade dos dados e precisão dos indicadores do dashboard.

## 🔍 Como Funciona

### 1. Algoritmo de Detecção

O sistema analisa TODAS as vendas usando múltiplos critérios de similaridade:

#### Critérios de Duplicação

**Obrigatórios:**
- ✅ **Horário Próximo**: Vendas criadas em até 5 minutos de distância
- ✅ **Score de Similaridade ≥ 7**: Calculado com base nos critérios abaixo

**Critérios Ponderados:**
| Critério | Peso | Descrição |
|----------|------|-----------|
| Mesmo Cliente | +2 | Nome do cliente idêntico (case insensitive) |
| Mesmo Valor | +3 | Valor total da venda idêntico (±R$ 0,01) |
| Mesmos Itens | +4 | Produtos e quantidades idênticos |
| Mesmo CPF | +2 | CPF do cliente idêntico (se informado) |
| Mesma Sessão | +1 | Mesma sessão de caixa |

#### Níveis de Confiança

```typescript
ALTA (High):     Todos os critérios principais atendem
                 → Remoção automática recomendada

MÉDIA (Medium):  3 ou mais critérios atendem
                 → Revisão recomendada antes da remoção

BAIXA (Low):     2 ou menos critérios atendem
                 → Pode não ser duplicata real
```

### 2. Exemplo Prático

**Cenário Real (da imagem):**
```
Venda 1: R$ 650,00 | rejane | 08:58 | #398a5
Venda 2: R$ 650,00 | rejane | 08:58 | #f19cabd
Venda 3: R$ 650,00 | rejane | 08:56 | #c4a42b
Venda 4: R$ 650,00 | rejane | 08:56 | #a78b33
Venda 5: R$ 650,00 | rejane | 08:55 | #e4ac62

Score de Similaridade:
+ 2 (Mesmo Cliente: "rejane")
+ 3 (Mesmo Valor: R$ 650,00)
+ 4 (Mesmos Itens: assumindo iguais)
+ 2 (Mesma Sessão: assumindo mesma)
= 11 pontos ✅ (≥ 7 requerido)

Tempo entre vendas: < 5 minutos ✅

RESULTADO: ALTA CONFIANÇA
Grupo: 1 venda original + 4 duplicatas
```

## 🛠️ Como Usar

### Passo 1: Acessar a Ferramenta

1. Faça login como **Administrador**
2. No menu lateral, clique em **"Limpar Duplicatas"** (ícone de escudo)
3. A tela de limpeza será exibida

### Passo 2: Analisar Duplicatas

1. Clique em **"Analisar Duplicatas"**
2. O sistema processará todas as vendas
3. Serão exibidos:
   - Total de vendas analisadas
   - Número de duplicatas encontradas
   - Valor total inflacionado
   - Grupos de duplicatas detectados

### Passo 3: Revisar Grupos

Para cada grupo detectado, você verá:

**Informações do Grupo:**
- Nível de confiança (Alta/Média/Baixa)
- Número de duplicatas
- Critérios que resultaram na detecção

**Venda Original (marcada em VERDE):**
- Esta será **MANTIDA** no sistema
- Informações: Cliente, Valor, Data/Hora, ID

**Duplicatas (marcadas em VERMELHO):**
- Estas serão **REMOVIDAS** se selecionadas
- Mesmas informações para comparação

### Passo 4: Selecionar para Remoção

1. **Grupos de alta confiança** são selecionados automaticamente
2. Revise cada grupo clicando em **"Ver Detalhes"**
3. **Marque/Desmarque** os grupos que deseja remover
4. A caixa de resumo mostra:
   - Total de vendas duplicadas selecionadas
   - Valor total a ser corrigido

### Passo 5: Remover Duplicatas

1. Clique em **"Remover Selecionadas (N)"**
2. **CONFIRME A AÇÃO** (IRREVERSÍVEL!)
3. Aguarde o processamento
4. Mensagem de sucesso será exibida

### Passo 6: Baixar Relatório (Opcional)

- Clique em **"Baixar Relatório"** para documentação
- Arquivo `.txt` com todos os detalhes será gerado
- Útil para auditoria e registro

## ⚠️ Avisos Importantes

### Proteções Implementadas

✅ **Restauração de Estoque**
- Ao remover uma venda duplicada, o estoque dos produtos é AUTOMATICAMENTE restaurado
- Evita perda de controle de estoque

✅ **Venda Original Preservada**
- SEMPRE mantém a primeira venda do grupo
- Apenas duplicatas subsequentes são removidas

✅ **Confirmação Obrigatória**
- Sistema solicita confirmação antes de remover
- Alerta sobre irreversibilidade da ação

✅ **Seleção Inteligente**
- Alta confiança: Pré-selecionado
- Média/Baixa confiança: Requer seleção manual

### Cenários de Uso

**✅ REMOVER:**
- Cliques múltiplos acidentais no botão "Confirmar Venda"
- Vendas idênticas em horários muito próximos
- Mesmo cliente, valor, itens e sessão

**❌ NÃO REMOVER:**
- Cliente comprou novamente em horário próximo (compra legítima)
- Valores diferentes mesmo com mesmo cliente
- Itens diferentes mesmo com mesmo valor

## 📊 Estrutura de Dados

### DuplicateGroup

```typescript
interface DuplicateGroup {
  originalSale: Sale;           // Venda a ser mantida
  duplicates: Sale[];           // Vendas a serem removidas
  criteria: {
    sameCustomer: boolean;
    sameTotal: boolean;
    sameItems: boolean;
    closeTime: boolean;
  };
  confidence: 'high' | 'medium' | 'low';
}
```

### DuplicateDetectionResult

```typescript
interface DuplicateDetectionResult {
  totalSales: number;           // Total de vendas analisadas
  duplicateGroups: DuplicateGroup[];  // Grupos detectados
  totalDuplicates: number;      // Total de duplicatas
  estimatedLoss: number;        // Valor inflacionado
}
```

## 🔧 Arquivos do Sistema

### Serviços

**`services/duplicateDetectionService.ts`**
- Algoritmo de detecção de duplicatas
- Comparação de vendas
- Cálculo de score de similaridade
- Geração de relatórios

**`services/supabaseService.ts`**
- Método `deleteSale()` adicionado
- Restauração automática de estoque
- Remoção segura do banco de dados

### Componentes

**`components/DuplicateCleanup.tsx`**
- Interface completa de limpeza
- Visualização de grupos
- Seleção e remoção

**`components/Sidebar.tsx`**
- Menu "Limpar Duplicatas" (apenas admin)

**`App.tsx`**
- Roteamento `/duplicates`
- Integração com sistema

## 📈 Impacto no Dashboard

Após limpar duplicatas, o dashboard refletirá:

✅ **Total de Vendas Correto**
- Remove contagens duplicadas
- Valores reais de receita

✅ **Estoque Preciso**
- Restaura quantidades que foram descontadas múltiplas vezes
- Sincroniza com vendas reais

✅ **Indicadores Corretos**
- Ticket médio real
- Lucro real
- Performance real

## 🧪 Exemplo de Teste

### Cenário de Teste

1. **Criar duplicata intencional:**
   - Abra PDV
   - Adicione produto ao carrinho
   - Finalize venda
   - Recarregue a página do histórico
   - O sistema deve mostrar apenas 1 venda

2. **Testar detecção:**
   - Vá para "Limpar Duplicatas"
   - Clique em "Analisar Duplicatas"
   - Nenhuma duplicata deve ser encontrada (correção funcionou!)

3. **Simular duplicatas antigas:**
   - Use SQL direto no Supabase para duplicar registros
   - Retorne à ferramenta
   - Verifique detecção correta

## 💡 Boas Práticas

### Recomendações

1. **Execute análise regularmente:**
   - Semanalmente ou mensalmente
   - Antes de gerar relatórios importantes
   - Após detectar inconsistências

2. **Revise grupos de média/baixa confiança:**
   - Não confie apenas na seleção automática
   - Verifique detalhes antes de remover

3. **Mantenha relatórios:**
   - Baixe relatório antes de remover
   - Armazene para auditoria

4. **Backup antes de grandes limpezas:**
   - Se detectar muitas duplicatas
   - Considere fazer backup do banco

## 🔐 Segurança

- ✅ Apenas **administradores** têm acesso
- ✅ Confirmação obrigatória antes de remover
- ✅ Ação irreversível claramente indicada
- ✅ Logs no console para rastreamento
- ✅ Validação de integridade referencial

## 📞 Resolução de Problemas

### "Nenhuma duplicata detectada"

Possíveis causas:
- ✅ Sistema está funcionando corretamente!
- ⚠️ Correção de cliques múltiplos já foi aplicada
- ⚠️ Não há duplicatas reais no banco

### "Erro ao remover duplicatas"

Soluções:
1. Verifique conexão com Supabase
2. Confirme permissões de usuário
3. Verifique console do navegador para detalhes
4. Tente remover em lotes menores

### "Valores não batem após remoção"

Ações:
1. Recarregue a página (F5)
2. Verifique se a remoção foi bem-sucedida no banco
3. Execute análise novamente

---

**Data de Criação:** 2025-12-13  
**Versão:** 1.0  
**Autor:** Sistema GestorPro  
**Status:** ✅ Pronto para Produção
