# Dados

Esta pasta é a fonte de verdade do projeto. Cada ficheiro `.jsonl` tem uma linha JSON por registo. O site e a base SQLite são derivados daqui.

![Página Resumo do painel, com os dados de 05/10/2026 que vêm desta pasta](../docs/img/painel-resumo.png)

## Validar e construir a base

    python3 scripts/build_db.py

O script valida todos os ficheiros e constrói `build/bodiva.db` (ignorado pelo git). Falha com a lista de erros se houver um campo em falta, um tipo errado, uma chave repetida ou um valor fora da lista permitida. Um PR com dados mal formados não passa o `check.yml`.

## Ficheiros

| Ficheiro | Conteúdo | Chave |
|---|---|---|
| `daily/AAAA-MM-DD.jsonl` | Preços do dia de sessão. `kind` pode ser `stock` (acções), `ot` (obrigações do Tesouro), `corp_bond` (obrigações privadas) ou `bt` (Bilhetes do Tesouro; aqui `price` é a taxa anual em %) | `date`, `kind`, `code` |
| `market/members-AAAA.jsonl` | Contas, custódia e volume de cada membro, do relatório Power BI. Volume e custódia em milhões de Kz (campos `*_mm_kz`) | `period`, `member` |
| `market/totals.jsonl` | Total negociado por ano, em biliões de Kz | `period` |
| `brokers/pricelists.jsonl` | Comissões de cada corretora, tal como estavam no preçário na data em que foi verificado | `broker`, `checked_on` |

Os valores `kind`, `extra_fees` e os tipos de cada campo estão definidos em `TABLES` e `ENUMS` em `scripts/build_db.py`. Esse ficheiro é a referência exata do esquema.

## Regras

- Cada registo diz de onde veio, em `source` ou `source_url`. Sem fonte, não entra.
- Valores em falta ficam `null`. Não se inventa um valor, nem se copia o do dia anterior.
- Quando uma corretora actualiza o preçário, acrescenta-se uma linha nova com outro `checked_on`. A linha antiga não se edita, para manter o histórico.
- Dados que não vêm directamente da fonte principal levam nota em `note`. Por exemplo, o `date` dos preços de 2026-10-05 foi inferido da "última actualização" do dashboard, e as taxas dos Bilhetes vêm da cópia do painel em biccorretora.ao.

## Actualização diária

    python3 scripts/daily_prices.py            # busca o ticker, escreve data/daily/AAAA-MM-DD.jsonl e valida
    python3 scripts/daily_prices.py --dry-run  # mostra as linhas sem escrever

- O bodiva.ao não responde a ligações directas, por isso o script usa o Firecrawl CLI (1 crédito por corrida). A resposta em bruto fica em `.firecrawl/daily/`.
- O GitHub Actions corre o script de segunda a sexta às 17:47 de Luanda (`.github/workflows/daily-prices.yml`) e faz commit do ficheiro do dia como `github-actions[bot]`.
- A data é o dia de sessão em Luanda. O script recusa correr antes das 15:30 e ao fim-de-semana, a não ser que se passe `--date`. A "Última actualização" da página é do relatório Power BI, não do ticker, por isso não serve como data.
- Se todos os preços e variações forem iguais aos do último ficheiro, o ticker não mexeu (feriado ou sem publicação) e o script não escreve nada.
- Se o ficheiro do dia já tiver preços diferentes desta fonte, o script pára. `--force` substitui só as linhas do ticker e mantém as de outras fontes (BDV e Bilhetes).
- Um código de acção novo no ticker faz o script falhar até ser adicionado a `STOCKS` em `scripts/daily_prices.py`.
- O BDV e as taxas dos Bilhetes não estão no ticker da BODIVA. Continuam a vir só do seed.

## Origem dos dados

`scripts/seed_from_firecrawl.py` gerou os ficheiros iniciais a partir de `.firecrawl/` e do `prototypes/painel.html`. Já foi corrido e não é preciso voltar a correr. Para as fontes de cada número, ver `docs/RESULTADOS.md`.
