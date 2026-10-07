# Dados

Os ficheiros `.jsonl` desta pasta são a fonte de verdade. Uma linha JSON por registo. A base SQLite é derivada e não vai para o repositório:

    python3 scripts/build_db.py     # cria build/bodiva.db e falha se houver erros

## Ficheiros

| Ficheiro | Conteúdo | Chave |
|---|---|---|
| `daily/AAAA-MM-DD.jsonl` | Preços do dia: acções (`stock`), obrigações do Tesouro (`ot`), obrigações privadas (`corp_bond`) e taxas dos Bilhetes (`bt`, em `price` vai a taxa anual em %) | data, kind, code |
| `market/members-AAAA.jsonl` | Contas, custódia e volume por membro, do relatório Power BI. Volume e custódia em mil milhões de Kz | período, membro |
| `market/totals.jsonl` | Total negociado por ano, em biliões de Kz | período |
| `brokers/pricelists.jsonl` | Comissões de cada corretora na data em que o preçário foi verificado | corretora, checked_on |

## Regras

- Cada registo diz de onde veio (`source` ou `source_url`). Sem fonte, não entra.
- Valores em falta ficam `null`. Não se inventa nem se copia o dia anterior.
- Preçários novos são linhas novas com outro `checked_on`. Não se edita a linha antiga, para manter o histórico.
- O `date` dos preços de 2026-10-05 foi inferido da "última actualização" do dashboard, e as taxas dos Bilhetes vêm da cópia do painel em biccorretora.ao. Está marcado em `note`.

## Estado actual

`scripts/seed_from_firecrawl.py` gerou estes ficheiros uma vez a partir de `.firecrawl/` e do `prototypes/painel.html`. O script diário vai escrever os mesmos formatos.
