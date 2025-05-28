# Property Import System

Sistema de importação de propriedades para WordPress, desenvolvido para gerenciar e automatizar o processo de importação de dados de imóveis.

## Setup

1. Ativar todos os plugins necessários vinculados ao plugin "Real Estate" como "G5".
2. Extrair arquivos do zip para o diretório `homeid/templates/`
3. Copiar o arquivo `import-functions.php` para o diretório `homeid/functions.php` do tema substituindo o arquivo existente.

## 🚀 Status do Projeto

### 1. Verificação de Propriedades
- [x] Pegar referência da propriedade no banco
- [x] Buscar as propriedades do banco pela referência
- [x] Identificar qual propriedade já existe
- [x] Listar somente as propriedades que não existem

### 2. Sistema de Imagens
- [x] Identificar maneira eficiênte de upload de imagem
- [x] Popular o banco com as imagens
- [x] Otimizar processamento de imagens
- [x] Implementar galeria/seleção de imagens

### 3. Gestão de Taxonomias
- [x] Pegar todas as taxonomias do banco
- [x] Pegar todas as taxonomias do arquivo
- [x] Verificar quais taxonomias estão inseridas no banco
- [x] Inserir taxonomias que faltam

### 4. Features do Imóvel
- [x] Ler o atributo features e formatar
- [x] Criar as features não existentes
- [x] Anexar features aos imóveis

### 5. Sistema de Agentes
- [x] Verificar se há o agente no sistema
- [x] Se houver, anexar agente ao imóvel
- [x] Caso contrário, vincular ao agente default
- [x] Criar seleção de agente default

### 6. Geolocalização
- [x] Formatar address e adicionar à UI
- [x] Adicionar Address ao mapa
- [x] Recuperar lat/long para adicionar ao banco

### 7. Responsividade
- [x] Ajustar layout para mobile

### 8. Importação
- [x] Subir mais de um imóvel por vez

## 🐛 Correções Necessárias

<s>1. Botão "Hide selections" não está visível</s>

<s>2. Descrição não aparece na UI, mas está no backend</s>

<s>3. Melhorar UI da seleção de imóveis (nomes grandes passam do background)</s>
