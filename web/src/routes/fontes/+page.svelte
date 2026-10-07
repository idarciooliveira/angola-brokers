<script lang="ts">
	import Card from '#lib/ui/Card.svelte';
	import ScrollTable from '#lib/ui/ScrollTable.svelte';
	import SourceNote from '#lib/ui/SourceNote.svelte';
	import { formatDate, formatNumber } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const list = (names: string[]) => (names.length > 0 ? names.join(', ') : 'nenhuma');
	const partial = $derived(data.totals.find((t) => t.partial) ?? null);

	const links = [
		{ label: 'Dashboard estatístico da BODIVA', href: 'https://www.bodiva.ao/estatistica/dashboard' },
		{ label: 'Membros da BODIVA', href: 'https://www.bodiva.ao/bodiva/participantes/membros' },
		{
			label: 'Guia de investimento da CMC (benefícios fiscais)',
			href: 'https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw4x/mtkx/~edisp/minfin1191819.pdf'
		},
		{ label: 'Taxas da CMC', href: 'https://www.cmc.ao/pt-pt/node/2325' },
		{
			label: 'Ficha técnica da BODIVA',
			href: 'https://www.bodiva.ao/reports/ficha-tecnica?i=AOBAIODOFA05&t=4'
		}
	];
</script>

<svelte:head>
	<title>Fontes | Painel BODIVA</title>
</svelte:head>

<p class="crumb">Metodologia</p>
<h1>Fontes e limites</h1>
<p class="lede">
	Cada número do site vem de um ficheiro em <code>data/</code>, com a fonte e a data. Abaixo diz-se
	de onde vem cada conjunto, quando foi actualizado e o que falta.
</p>

<div class="grid">
	<Card
		title="Preços diários"
		subtitle="Acções, Obrigações do Tesouro, obrigações privadas e Bilhetes do Tesouro."
		source="BODIVA e biccorretora.ao, fecho de {formatDate(data.daily.last)}"
	>
		<dl class="facts">
			<dt>De onde vem</dt>
			<dd>
				Ticker da BODIVA, em bodiva.ao. Um script lê-o e guarda o dia em <code>data/daily/</code>.
				Corre em dias úteis, depois do fecho. Os BDV e as taxas dos Bilhetes não vêm do ticker da
				BODIVA. Vêm da cópia do ticker em biccorretora.ao.
			</dd>
			<dt>Actualizado</dt>
			<dd>
				{data.daily.days}
				{data.daily.days === 1 ? 'dia' : 'dias'}, de {formatDate(data.daily.first)} a {formatDate(
					data.daily.last
				)}. Vêm de biccorretora.ao: {list(data.daily.copies)}. A data do primeiro dia, 05/10/2026,
				foi inferida da "última actualização" do dashboard. Os dias seguintes levam o dia de sessão em
				Luanda.
			</dd>
			<dt>O que falta</dt>
			<dd>
				Histórico antes de {formatDate(data.daily.first)}. O boletim diário da BODIVA, enquanto o
				site não responder a ligações directas.
			</dd>
		</dl>
	</Card>

	<div class="wide">
		<Card
			title="Contas, custódia e volume por membro"
			subtitle="Custódia e volume em mil milhões de kwanzas."
			source="BODIVA, dashboard estatístico (Power BI), lido por tooltip"
		>
			<dl class="facts">
				<dt>De onde vem</dt>
				<dd>
					Relatório Power BI do dashboard estatístico da BODIVA. Os valores foram lidos ao passar o
					rato sobre cada barra. Volume conta as duas pontas de cada operação. Uma compra entre dois
					membros soma no comprador e no vendedor.
				</dd>
			</dl>

			<div class="table-gap">
				<ScrollTable caption="Dados por membro, por ano">
					<thead>
						<tr>
							<th>Ano</th>
							<th>Dados de</th>
							<th class="r">Membros</th>
							<th class="r">Sem contas</th>
							<th class="r">Sem custódia</th>
							<th class="r">Sem volume</th>
						</tr>
					</thead>
					<tbody>
						{#each data.members as m (m.year)}
							<tr>
								<td><strong>{m.year}</strong></td>
								<td>{formatDate(m.asOf)}</td>
								<td class="r num">{formatNumber(m.members)}</td>
								<td class="r num">{formatNumber(m.noAccounts)}</td>
								<td class="r num">{formatNumber(m.noCustody)}</td>
								<td class="r num">{formatNumber(m.noVolume)}</td>
							</tr>
						{/each}
					</tbody>
				</ScrollTable>
			</div>

			<dl class="facts">
				<dt>O que falta</dt>
				<dd>
					Um traço (—) quer dizer que o valor não foi capturado do relatório. Em 2025 não há contas
					nem custódia. O volume de 2024 por membro ainda não foi extraído.
				</dd>
			</dl>
		</Card>
	</div>

	<Card
		title="Total negociado por ano"
		subtitle="Em biliões de kwanzas."
		source="BODIVA, dashboard estatístico"
	>
		<ScrollTable caption="Total negociado por ano">
			<thead>
				<tr>
					<th>Ano</th>
					<th class="r">Total</th>
					<th>Dados até</th>
				</tr>
			</thead>
			<tbody>
				{#each data.totals as t (t.period)}
					<tr>
						<td><strong>{t.period}</strong></td>
						<td class="r num">{formatNumber(t.total, 2)}</td>
						<td>{t.partial ? formatDate(t.asOf) : 'Ano completo'}</td>
					</tr>
				{/each}
			</tbody>
		</ScrollTable>
		<dl class="facts">
			<dt>De onde vem</dt>
			<dd>Dashboard estatístico da BODIVA, o mesmo relatório dos membros.</dd>
			<dt>Actualizado</dt>
			<dd>
				O ano de {partial?.period ?? '—'} vai só até {formatDate(partial?.asOf ?? null)}. Os outros
				anos estão completos.
			</dd>
			<dt>O que falta</dt>
			<dd>Bilateral e multilateral só existem para o ano parcial.</dd>
		</dl>
	</Card>

	<Card
		title="Preçários das corretoras"
		subtitle="Comissões revistas à mão, uma por corretora."
		source="Preçários das corretoras, verificados até {formatDate(data.pricelists.checkedOn)}"
	>
		<dl class="facts">
			<dt>De onde vem</dt>
			<dd>
				PDFs ou páginas de cada corretora, revistos à mão. Cada preçário tem a data e o link. Ver a
				página <a href="/corretoras">Corretoras</a>.
			</dd>
			<dt>Actualizado</dt>
			<dd>
				{data.pricelists.total} preçários, verificados até {formatDate(data.pricelists.checkedOn)}.
			</dd>
		</dl>

		<div class="table-gap">
			<ScrollTable caption="Preçários que precisam de atenção">
				<thead>
					<tr>
						<th>Estado</th>
						<th class="r">Nº</th>
						<th>Corretoras</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Antigos</td>
						<td class="r num">{data.pricelists.stale.length}</td>
						<td>{list(data.pricelists.stale)}</td>
					</tr>
					<tr>
						<td>Por confirmar</td>
						<td class="r num">{data.pricelists.uncertain.length}</td>
						<td>{list(data.pricelists.uncertain)}</td>
					</tr>
					<tr>
						<td>Sem data</td>
						<td class="r num">{data.pricelists.noDate.length}</td>
						<td>{list(data.pricelists.noDate)}</td>
					</tr>
				</tbody>
			</ScrollTable>
		</div>

		<dl class="facts">
			<dt>O que falta</dt>
			<dd>
				Há cerca de 31 membros na BODIVA e só {data.pricelists.total} corretoras têm preçário.
				Faltam os bancos, como BAI, Banco Sol, Standard Bank e BPC, e a Resultados, sem preçário
				encontrado. O preçário da Lwei vem do Scribd, não do site oficial. Prospectum e Prime parecem
				tabelas para clientes institucionais.
			</dd>
		</dl>
	</Card>

	<Card
		title="Impostos e taxas"
		subtitle="IVA, IAC, Imposto do Selo e taxas de supervisão."
		source="Guia de investimento da CMC, ficha técnica da BODIVA"
	>
		<dl class="facts">
			<dt>De onde vem</dt>
			<dd>
				Guia de investimento da CMC, quadro de benefícios fiscais, e ficha técnica da BODIVA. As
				taxas da BODIVA e da CEVAMA vêm do preçário da BODIVA de 02/02/2026.
			</dd>
			<dt>Actualizado</dt>
			<dd>
				Pesquisa de 07/10/2026. Os impostos não estão em <code>data/</code>, por isso não têm ficheiro
				próprio.
			</dd>
			<dt>O que falta</dt>
			<dd>
				O IAC sobre dividendos, de 10%, vem de fontes secundárias e está por confirmar. Falta saber se
				a Taxa de Supervisão Contínua é repassada ao cliente ou absorvida pela corretora.
			</dd>
		</dl>
	</Card>
</div>

<section class="links">
	<h2>Ligações externas</h2>
	<ul>
		{#each links as link (link.href)}
			<li>
				<a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
			</li>
		{/each}
	</ul>
</section>

<SourceNote>
	Esta informação não é aconselhamento financeiro. Confirma as taxas no preçário da corretora antes de
	investir.
</SourceNote>

<style>
	.crumb {
		font-size: 12px;
		color: var(--mute);
		margin-bottom: 10px;
	}
	h1 {
		font-size: clamp(28px, 4vw, 38px);
		line-height: 1.15;
		letter-spacing: -0.01em;
	}
	.lede {
		max-width: 62ch;
		margin-top: 10px;
		font-size: 15px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		margin-top: 32px;
	}
	.wide {
		grid-column: 1 / -1;
		min-width: 0;
	}
	.table-gap {
		margin-top: 14px;
	}
	.facts {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		gap: 10px 16px;
		margin: 16px 0 0;
		font-size: 13px;
	}
	.facts dt {
		color: var(--mute);
	}
	.facts dd {
		margin: 0;
	}
	.links {
		margin-top: 40px;
	}
	.links h2 {
		font-size: 16px;
		margin-bottom: 10px;
	}
	.links ul {
		margin: 0;
		padding-left: 18px;
		font-size: 14px;
		line-height: 1.8;
	}
	@media (max-width: 900px) {
		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
		.facts {
			grid-template-columns: minmax(0, 1fr);
			gap: 4px;
		}
		.facts dt {
			margin-top: 8px;
		}
	}
</style>
