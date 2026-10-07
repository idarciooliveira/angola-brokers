<script lang="ts">
	import BarChart from '#lib/charts/BarChart.svelte';
	import ColumnChart from '#lib/charts/ColumnChart.svelte';
	import Card from '#lib/ui/Card.svelte';
	import Chip from '#lib/ui/Chip.svelte';
	import ScrollTable from '#lib/ui/ScrollTable.svelte';
	import SourceNote from '#lib/ui/SourceNote.svelte';
	import Stat from '#lib/ui/Stat.svelte';
	import { formatDate, formatKz, formatNumber, formatPct, formatSignedPct } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const source = $derived(`BODIVA, fecho de ${formatDate(data.date)}`);
</script>

<svelte:head>
	<title>Resumo | Painel BODIVA</title>
</svelte:head>

<p class="crumb">Mercado de capitais de Angola</p>
<h1>O que se passa na BODIVA</h1>
<p class="lede">A bolsa de Angola, em poucos números. Último fecho: {formatDate(data.date)}.</p>

<section class="kpis" aria-label="Números principais">
	<Stat
		label="Bilhete do Tesouro a 364 dias"
		value={formatPct(data.bt364)}
		hint="Taxa anual, cópia em biccorretora.ao"
	/>
	<Stat
		label="Total negociado em {data.period}"
		value="Kz {formatNumber(data.totalBi, 2)} bi"
		hint="Até {formatDate(data.totalsAsOf)}"
	/>
	<Stat label="Contas de investidor" value={formatNumber(data.accounts)} hint="Todas as corretoras" />
	<Stat
		label="Acção que mais mexeu"
		value={data.mover?.code ?? '—'}
		hint={data.mover ? `${formatSignedPct(data.mover.change)} no dia` : undefined}
	/>
</section>

<h2>Acções cotadas</h2>
<Card title="Preço e variação do dia" subtitle="Preço em kwanzas" {source}>
	<ScrollTable caption="Acções cotadas na BODIVA">
		<thead>
			<tr><th>Acção</th><th class="r">Preço</th><th class="r">Variação</th></tr>
		</thead>
		<tbody>
			{#each data.stocks as s (s.code)}
				<tr>
					<td><strong>{s.code}</strong> <span class="mute">{s.name}</span></td>
					<td class="r num">{formatKz(s.price)}</td>
					<td class="r"><Chip value={s.change} /></td>
				</tr>
			{/each}
		</tbody>
	</ScrollTable>
</Card>
{#if data.unofficial.length > 0}
	<SourceNote variant="warn">
		Nem tudo vem da BODIVA. {data.unofficial.join(', ')} vêm da cópia do ticker em biccorretora.ao e podem
		estar desactualizados.
	</SourceNote>
{/if}
<SourceNote>
	Comprar uma acção é ficar com um pedaço pequeno da empresa. O preço sobe e desce todos os dias e
	não há rendimento garantido.
</SourceNote>

<div class="two">
	<Card
		title="Total negociado por ano"
		subtitle="Biliões de kwanzas. {data.period} vai só até {formatDate(data.totalsAsOf)}."
		source="BODIVA, dashboard estatístico"
	>
		<ColumnChart
			ariaLabel="Total negociado por ano, em biliões de kwanzas"
			items={data.years.map((y) => ({
				label: y.label,
				value: y.value,
				valueLabel: formatNumber(y.value, 2),
				partial: y.partial
			}))}
		/>
	</Card>
	<Card
		title="Corretoras com mais volume em {data.period}"
		subtitle="Mil milhões de kwanzas negociados."
		source="BODIVA, dashboard estatístico"
	>
		<BarChart
			ariaLabel="Cinco corretoras com mais volume, em mil milhões de kwanzas"
			items={data.topBrokers.map((b) => ({
				label: b.name,
				value: b.volume,
				valueLabel: formatNumber(b.volume, 0)
			}))}
		/>
	</Card>
</div>

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
	h2 {
		font-size: 26px;
		margin: 44px 0 14px;
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
		margin-top: 32px;
	}
	.two {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		margin-top: 32px;
	}
	@media (max-width: 900px) {
		.kpis {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.two {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	@media (max-width: 520px) {
		.kpis {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
