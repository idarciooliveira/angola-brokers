# angola-brokers

Painel do mercado BODIVA e comparador de preçários das corretoras angolanas.

![Página Resumo do painel, com os dados de 05/10/2026 que vêm de `data/`](docs/img/painel-resumo.png)

## Estrutura

- `data/`: fonte de verdade em `.jsonl`.
- `scripts/build_db.py`: valida `data/` e constrói `build/bodiva.db` (ignorado pelo git).
- `scripts/daily_prices.py`: busca o ticker da BODIVA e escreve `data/daily/AAAA-MM-DD.jsonl`.
- `scripts/ot_registry.py`: lê o boletim da BODIVA e acrescenta as Obrigações do Tesouro novas a `data/instruments/ot.jsonl`.
- `.github/workflows/daily-prices.yml`: corre o script diário depois do fecho e faz commit do ficheiro do dia.
- `web/`: site SvelteKit com Svelte 5, pré-gerado com `adapter-static`. Lê `../data` no build.
- `docs/RESULTADOS.md`: análise das fontes e links dos preçários.

## Dados

Cada ficheiro `.jsonl` em `data/` tem uma linha JSON por registo. A base SQLite é derivada e não vai para o repositório.

### Validar e construir a base

    python3 scripts/build_db.py

O script valida todos os ficheiros e constrói `build/bodiva.db`. Falha com a lista de erros se houver um campo em falta, um tipo errado, uma chave repetida ou um valor fora da lista permitida. Um PR com dados mal formados não passa o `check.yml`.

### Ficheiros

| Ficheiro | Conteúdo | Chave |
|---|---|---|
| `data/daily/AAAA-MM-DD.jsonl` | Preços do dia de sessão. `kind` pode ser `stock` (acções), `ot` (obrigações do Tesouro), `corp_bond` (obrigações privadas) ou `bt` (Bilhetes do Tesouro; aqui `price` é a taxa anual em %) | `date`, `kind`, `code` |
| `data/instruments/ot.jsonl` | Dados fixos de cada Obrigação do Tesouro: tipo, data de emissão, data de vencimento e cupão anual em %. Vêm do Boletim Oficial de Mercado da BODIVA. O site usa-os para o nome, a data de vencimento e o prazo que falta | `code` |
| `data/market/members-AAAA.jsonl` | Contas, custódia e volume de cada membro, do relatório Power BI. Volume e custódia em milhões de Kz (campos `*_mm_kz`) | `period`, `member` |
| `data/market/totals.jsonl` | Total negociado por ano, em biliões de Kz | `period` |
| `data/brokers/pricelists.jsonl` | Comissões de cada corretora, tal como estavam no preçário na data em que foi verificado | `broker`, `checked_on` |

Os tipos de cada campo e os valores permitidos estão em `TABLES` e `ENUMS` em `scripts/build_db.py`. Esse ficheiro é a referência exata do esquema.

### Regras

- Cada registo diz de onde veio, em `source` ou `source_url`. Sem fonte, não entra.
- Valores em falta ficam `null`. Não se inventa um valor, nem se copia o do dia anterior.
- Quando uma corretora actualiza o preçário, acrescenta-se uma linha nova com outro `checked_on`. A linha antiga não se edita, para manter o histórico.
- Dados que não vêm directamente da fonte principal levam nota em `note`. Por exemplo, o `date` dos preços de 2026-10-05 foi inferido da "última actualização" do dashboard, e as taxas dos Bilhetes vêm da cópia do painel em biccorretora.ao.

### Actualização diária

    python3 scripts/daily_prices.py            # busca o ticker, escreve data/daily/AAAA-MM-DD.jsonl e valida
    python3 scripts/daily_prices.py --dry-run  # mostra as linhas sem escrever

- O bodiva.ao não responde a ligações directas, por isso o script usa o Firecrawl CLI (1 crédito por corrida). A resposta em bruto fica em `.firecrawl/daily/`.
- O GitHub Actions corre o script de segunda a sexta às 17:47 de Luanda e faz commit do ficheiro do dia como `github-actions[bot]`.
- A data é o dia de sessão em Luanda. O script recusa correr antes das 15:30 e ao fim-de-semana, a não ser que se passe `--date`. A "Última actualização" da página é do relatório Power BI, não do ticker, por isso não serve como data.
- Se todos os preços e variações forem iguais aos do último ficheiro, o ticker não mexeu (feriado ou sem publicação) e o script não escreve nada.
- Se o ficheiro do dia já tiver preços diferentes desta fonte, o script pára. `--force` substitui só as linhas do ticker e mantém as de outras fontes (BDV e Bilhetes).
- Um código de acção novo no ticker faz o script falhar até ser adicionado a `STOCKS` em `scripts/daily_prices.py`.
- O BDV e as taxas dos Bilhetes não estão no ticker da BODIVA. Continuam a vir só do seed.

### Obrigações do Tesouro

O ticker só dá código, preço e variação. O `price` de uma OT é uma percentagem do valor nominal, não kwanzas: com valor nominal de 1 000 Kz, 102,00 custa 1 020 Kz. As datas e o cupão vêm do boletim diário da BODIVA (`bodiva.ao/media/boletim-diario/boletimdiarioAAAAMMDD.pdf`), que as lista para os títulos negociados nesse dia.

    python3 scripts/ot_registry.py            # lê o boletim do último dia em data/daily e acrescenta os títulos novos
    python3 scripts/ot_registry.py --dry-run  # mostra os títulos novos sem escrever

- Os dados são fixos depois da emissão. Um título já registado não se reescreve, e o script pára se o boletim trouxer outros valores para ele.
- O PDF tem gralhas nos códigos (`OII5A30A` em vez de `OI15A30A`). O script ignora as linhas em que o dia e o ano do código não batem com a data de vencimento.
- Um título que aparece no ticker e não está em `data/instruments/ot.jsonl` faz falhar o teste `cobrem todas as OT dos preços diários`. O site continua a compilar e mostra esse título só com o ano lido do código. Corre o script noutro dia até o título aparecer no boletim.
- O prazo ("Falta") calcula-se no build, em meses completos entre o dia do fecho e a data de vencimento. Não está guardado em lado nenhum.

### Origem dos dados

`scripts/seed_from_firecrawl.py` gerou os ficheiros iniciais a partir de `.firecrawl/` e do `prototypes/painel.html`. Já foi corrido e não é preciso voltar a correr. Para as fontes de cada número, ver `docs/RESULTADOS.md`.
