# Suplementos - Padrão de Arquivos

Este guia descreve como criar novos suplementos para o sistema.

## Como Criar um Novo Suplemento

1. Faça uma cópia do arquivo `example_supplement.json` nesta pasta.
2. Renomeie o arquivo copiado para o nome do suplemento (ex: `meusupplmento.json`).
3. Preencha os campos conforme o modelo de exemplo (detalhes abaixo).
4. Valide o arquivo no [JSONLint](https://jsonlint.com) antes de salvar e fazer commit.

### Aviso Rápido:
- Sempre use nomes de sintomas sem acentos, sem espaços e em minúsculas (ex: `gordura_abdominal_resistente`).
- NUNCA deixe campos obrigatórios vazios ou fora do padrão!
- Valide sempre seu arquivo no [JSONLint](https://jsonlint.com) antes de subir para o GitHub.

### Estrutura do Arquivo

Cada suplemento é representado por um arquivo `.json` e segue o padrão abaixo:

```json
{
  "suplemento": "Nome do suplemento",
  "sintomas": {
    "sintoma_exemplo": {
      "fase_1": {
        "copy_pt": ["Texto de introdução em português"],
        "copy_en": ["Intro text in English"],
        "quick_replies_pt": ["Resposta rápida 1", "Resposta rápida 2"],
        "quick_replies_en": ["Quick reply 1", "Quick reply 2"],
        "reflective_questions_pt": ["Pergunta reflexiva 1", "Pergunta reflexiva 2"],
        "reflective_questions_en": ["Reflective question 1", "Reflective question 2"]
      },
      "fase_2": { ... },
      "fase_3": { ... },
      "fase_4": { ... },
      "fase_5": { ... }
    }
  }
}
