# Suplementos - Padrão de Arquivos

## Como criar um novo suplemento

1. Faça uma cópia do arquivo `example_supplement.json` nesta pasta.
2. Renomeie o arquivo copiado para o nome do suplemento (ex: `meusuplemento.json`).
3. Preencha os campos conforme o modelo.
4. Valide o arquivo em https://jsonlint.com antes de salvar e fazer commit.

## Estrutura do arquivo

- `suplemento`: Nome do suplemento.
- `sintomas`: Cada chave é um sintoma (ex: "gordura_abdominal_resistente").
    - Dentro de cada sintoma existem as fases do funil (`fase_1` a `fase_5`).
        - `copy_pt`: Array com 3 copys em português.
        - `copy_en`: Array com 3 copys em inglês.
        - `quick_replies_pt`: Perguntas rápidas em português.
        - `quick_replies_en`: Perguntas rápidas em inglês.

**Sempre use o `example_supplement.json` como base para evitar erros!**

