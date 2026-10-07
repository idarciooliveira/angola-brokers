# angola-brokers

Painel do mercado BODIVA e comparador de preçários das corretoras angolanas.

## Estrutura

- `data/`: fonte de verdade em `.jsonl`. Regras e esquema em `data/README.md`.
- `scripts/build_db.py`: valida `data/` e constrói `build/bodiva.db` (ignorado pelo git).
- `scripts/daily_prices.py`: busca o ticker da BODIVA e escreve `data/daily/AAAA-MM-DD.jsonl`.
- `.github/workflows/daily-prices.yml`: corre o script diário depois do fecho e faz commit do ficheiro do dia.
- `scripts/seed_from_firecrawl.py`: seed único, já corrido. Não voltar a correr sem motivo.
- `docs/RESULTADOS.md`: análise das fontes e links dos preçários.
- `prototypes/`: protótipos HTML estáticos, só para referência visual.
- `.firecrawl/`: scrapes em bruto (ignorado pelo git).

## Regras de commit

Os hooks em `.githooks/` aplicam estas regras. Depois de clonar, correr `git config core.hooksPath .githooks`.

- Um ficheiro por commit. Para alterar três ficheiros, fazer três commits.
- A primeira linha começa com um prefixo do git workflow: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert` ou `data`, com âmbito opcional. Exemplo: `feat(scripts): add daily price scraper`.
- O Claude nunca aparece como autor nem como co-autor. Nada de `Co-Authored-By: Claude`, `noreply@anthropic.com` ou "Generated with Claude Code" em commits ou PRs. O autor é sempre o utilizador do git configurado.
- Não usar `--no-verify` para contornar os hooks.
