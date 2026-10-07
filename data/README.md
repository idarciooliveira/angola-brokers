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

## Actualização diária

    python3 scripts/daily_prices.py            # busca o ticker, escreve data/daily/AAAA-MM-DD.jsonl e valida
    python3 scripts/daily_prices.py --dry-run  # mostra as linhas sem escrever

- O bodiva.ao não responde a ligações directas, por isso o script usa o Firecrawl CLI (1 crédito por corrida). A resposta em bruto fica em `.firecrawl/daily/`.
- O GitHub Actions corre o script de segunda a sexta às 17:47 de Luanda (`.github/workflows/daily-prices.yml`) e faz commit do ficheiro do dia como `github-actions[bot]`.
- A data é o dia de sessão em Luanda. O script recusa correr antes das 15:30 e ao fim-de-semana, a não ser que se passe `--date`. A "Última actualização" da página é do relatório Power BI, não do ticker, por isso não serve como data.
- Se todos os preços e variações forem iguais aos do último ficheiro, o ticker não mexeu (feriado ou sem publicação) e o script não escreve nada.
- Se o ficheiro do dia já tiver preços diferentes desta fonte, o script pára. `--force` substitui só as linhas do ticker e mantém as de outras fontes (BDV e Bilhetes).
- Um código de acção novo no ticker faz o script falhar até ser adicionado a `STOCKS`.
- O BDV e as taxas dos Bilhetes não estão no ticker da BODIVA. Continuam a vir só do seed.

`scripts/seed_from_firecrawl.py` gerou os ficheiros iniciais a partir de `.firecrawl/` e do `prototypes/painel.html`. Já não é preciso correr.
