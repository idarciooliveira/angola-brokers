<script lang="ts">
	import Bars from '#lib/ui/Bars.svelte';
	import Card from '#lib/ui/Card.svelte';
	import Chip from '#lib/ui/Chip.svelte';
	import ScrollTable from '#lib/ui/ScrollTable.svelte';
	import SectionTitle from '#lib/ui/SectionTitle.svelte';
	import SourceNote from '#lib/ui/SourceNote.svelte';
	import Stat from '#lib/ui/Stat.svelte';
	import { formatDate, formatNumber, formatPct, formatSignedPct } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const source = $derived(`BODIVA, fecho de ${formatDate(data.date)}`);
	const compare = $derived(
		data.previousYear
			? data.totalBi > data.previousYear.totalBi
				? `, mais do que em todo o ano de ${data.previousYear.period}`
				: `, contra Kz ${formatNumber(data.previousYear.totalBi, 1)} biliões em todo o ano de ${data.previousYear.period}`
			: ''
	);
</script>

<svelte:head>
	<title>Resumo | Painel BODIVA</title>
</svelte:head>

<p class="crumb">Mercado de capitais de Angola</p>
<h1>O que se passa na BODIVA</h1>
<p class="lede">A bolsa de Angola, em poucos números. O resto está nas outras secções.</p>

<div class="say">
	<span class="tag">Resumo de hoje</span>
	<p>
		<b>{data.fallers} das {data.stocks.length} acções desceram</b> na última sessão{#if data.worst},
			e {data.worst.code} caiu mais, {formatSignedPct(data.worst.change)}{/if}.
		{#if data.bestBill && data.worstBill && data.bestBill.days !== data.worstBill.days}
			Os <b>Bilhetes do Tesouro a {data.bestBill.days} dias pagam {formatPct(data.bestBill.ratePct, 1)}</b>
			ao ano, a melhor taxa do dia, mas os de {data.worstBill.days} dias pagam só
			{formatPct(data.worstBill.ratePct)}.
		{/if}
		Em {data.period} já se negociaram <b>Kz {formatNumber(data.totalBi, 1)} biliões</b>{compare}.
	</p>
</div>

<SectionTitle title="Mercado agora" />
<section class="kpis" aria-label="Números principais">
	<Stat
		label="Negociado em {data.period}"
		value="Kz {formatNumber(data.totalBi, 2)} bi"
		hint="até {formatDate(data.totalsAsOf)}"
	/>
	<Stat
		label="Contas de investidores"
		value={formatNumber(data.accounts)}
		hint={data.accountsLeaders
			? `${data.accountsLeaders.names[0]} e ${data.accountsLeaders.names[1]} têm ${formatNumber(data.accountsLeaders.sharePct)}%`
			: 'Todas as corretoras'}
	/>
	<Stat
		label="Bilhete do Tesouro, 1 ano"
		value={formatPct(data.bt364)}
		hint="ao ano, antes de imposto"
	/>
	<Stat
		label="Corretora mais barata"
		value={data.cheapest ? `~${formatPct(data.cheapest.pct)}` : '—'}
		hint={data.cheapest
			? `Kz ${formatNumber(data.cheapest.amount / 1_000_000)} M em OT, ${data.cheapest.name}`
			: undefined}
	/>
</section>

<SectionTitle title="Acções cotadas" hint="Preço em kwanzas" />
<Card {source}>
	<ScrollTable caption="Acções cotadas na BODIVA">
		<thead>
			<tr><th>Acção</th><th class="r">Preço</th><th class="r">Variação</th></tr>
		</thead>
		<tbody>
			{#each data.stocks as s (s.code)}
				<tr>
					<td><strong>{s.code}</strong> <span class="mute">{s.name}</span></td>
					<td class="r num">{formatNumber(s.price)}</td>
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
		<Bars
			items={data.years.map((y) => ({
				label: y.partial ? `${y.label} (parcial)` : y.label,
				value: y.value,
				valueLabel: formatNumber(y.value, 2),
				alt: !y.partial
			}))}
		/>
	</Card>
	<Card
		title="Corretoras com mais volume em {data.period}"
		subtitle="Mil milhões de kwanzas negociados."
		source="BODIVA, dashboard estatístico"
	>
		<Bars
			items={data.topBrokers.map((b) => ({
				label: b.name,
				value: b.volume,
				valueLabel: formatNumber(b.volume, 0)
			}))}
		/>
	</Card>
</div>

<div class="go">
	<a class="pill" href="/mercado">Ver preços →</a>
	<a class="pill pri" href="/corretoras">Comparar corretoras →</a>
	<a class="pill" href="/simulador">Simular um investimento →</a>
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
	.say {
		max-width: 760px;
		margin-top: 22px;
		padding: 22px 24px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: #fff;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
	}
	.tag {
		display: inline-block;
		margin-bottom: 12px;
		padding: 3px 12px;
		border-radius: 99px;
		background: var(--soft);
		font-size: 13px;
	}
	.say p {
		font-size: 15px;
		line-height: 1.65;
		color: var(--mute);
	}
	.say b {
		font-weight: 600;
		color: #000;
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}
	.two {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		margin-top: 32px;
	}
	.go {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 22px;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: #fff;
		font-size: 13.5px;
		color: inherit;
		text-decoration: none;
	}
	.pill:hover {
		background: var(--soft);
	}
	.pill.pri {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
	}
	.pill.pri:hover {
		background: #5d1451;
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
