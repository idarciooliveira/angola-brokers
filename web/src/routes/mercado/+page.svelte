<script lang="ts">
	import { logoPath } from '#lib/brokers';
	import Bars from '#lib/ui/Bars.svelte';
	import BrokerLogo from '#lib/ui/BrokerLogo.svelte';
	import Card from '#lib/ui/Card.svelte';
	import Chip from '#lib/ui/Chip.svelte';
	import ScrollTable from '#lib/ui/ScrollTable.svelte';
	import SectionTitle from '#lib/ui/SectionTitle.svelte';
	import Seg from '#lib/ui/Seg.svelte';
	import SourceNote from '#lib/ui/SourceNote.svelte';
	import { formatDate, formatNumber, formatPct } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Product = 'bt' | 'ot' | 'corp' | 'ac';
	let product = $state<Product>('bt');

	const products: { value: Product; label: string }[] = [
		{ value: 'bt', label: 'Bilhetes do Tesouro' },
		{ value: 'ot', label: 'Obrigações do Tesouro' },
		{ value: 'corp', label: 'Obrigações privadas' },
		{ value: 'ac', label: 'Acções' }
	];

	const info: Record<Product, { title: string; hint: string; help: string }> = {
		bt: {
			title: 'Bilhetes do Tesouro',
			hint: 'Taxa anual',
			help: 'Ao comprar um Bilhete emprestas dinheiro ao Estado e recebes mais no fim do prazo. A taxa é conhecida à partida. O risco é o Estado angolano.'
		},
		ot: {
			title: 'Obrigações do Tesouro',
			hint: 'Preço em % do valor nominal',
			help: 'Preço abaixo de 100 sai mais barato que o valor final. O ano de vencimento vem do código do título, por exemplo OJ10M28A vence em 2028.'
		},
		corp: {
			title: 'Obrigações privadas',
			hint: 'Preço em % do valor nominal',
			help: 'Empréstimos a empresas, não ao Estado. O risco é o da empresa que emitiu.'
		},
		ac: {
			title: 'Acções cotadas',
			hint: 'Preço em kwanzas',
			help: 'Comprar uma acção é ficar com um pedaço pequeno da empresa. O preço sobe e desce todos os dias e não há rendimento garantido.'
		}
	};

	const current = $derived(
		{ bt: data.bills, ot: data.ots, corp: data.corp, ac: data.stocks }[product]
	);

	const years = [
		{ value: '2025', label: '2025' },
		{ value: '2026', label: '2026' }
	] as const;
	let year = $state<'2025' | '2026'>('2026');
	const membersOfYear = $derived(data.members[year]);
	const membersSource = $derived(
		`BODIVA, dashboard estatístico (Power BI), dados de ${formatDate(membersOfYear.asOf)}`
	);
</script>

<svelte:head>
	<title>Mercado | Painel BODIVA</title>
</svelte:head>

<p class="crumb">Preços do dia</p>
<h1>Mercado</h1>
<p class="lede">Preços e taxas de {formatDate(data.date)}. Escolhe o tipo de produto.</p>

<div class="pick"><Seg options={products} bind:value={product} label="Tipo de produto" /></div>

<SectionTitle title={info[product].title} hint={info[product].hint} />
<Card source={current.source}>
	{#if product === 'bt'}
		<Bars
			items={data.bills.items.map((b) => ({
				label: `${b.days} dias`,
				value: b.rate,
				valueLabel: formatPct(b.rate)
			}))}
		/>
	{:else if product === 'ot'}
		<ScrollTable caption="Obrigações do Tesouro por ano de vencimento">
			<thead>
				<tr><th>Título</th><th class="r">Vence</th><th class="r">Preço</th><th class="r">Variação</th></tr>
			</thead>
			<tbody>
				{#each data.ots.items as o (o.code)}
					<tr>
						<td><strong>{o.code}</strong></td>
						<td class="r num">{o.year ?? '—'}</td>
						<td class="r num">{formatNumber(o.price, 2)}</td>
						<td class="r"><Chip value={o.change} /></td>
					</tr>
				{:else}
					<tr><td colspan="4" class="mute">Sem dados neste fecho.</td></tr>
				{/each}
			</tbody>
		</ScrollTable>
	{:else if product === 'corp'}
		<ScrollTable caption="Obrigações privadas">
			<thead>
				<tr><th>Título</th><th class="r">Preço</th><th class="r">Variação</th></tr>
			</thead>
			<tbody>
				{#each data.corp.items as c (c.code)}
					<tr>
						<td><strong>{c.code}</strong></td>
						<td class="r num">{formatNumber(c.price, 2)}</td>
						<td class="r"><Chip value={c.change} /></td>
					</tr>
				{:else}
					<tr><td colspan="3" class="mute">Sem dados neste fecho.</td></tr>
				{/each}
			</tbody>
		</ScrollTable>
	{:else}
		<ScrollTable caption="Acções cotadas na BODIVA">
			<thead>
				<tr><th>Acção</th><th class="r">Preço</th><th class="r">Variação</th></tr>
			</thead>
			<tbody>
				{#each data.stocks.items as s (s.code)}
					<tr>
						<td><strong>{s.code}</strong> <span class="mute">{s.name}</span></td>
						<td class="r num">{formatNumber(s.price)}</td>
						<td class="r"><Chip value={s.change} /></td>
					</tr>
				{:else}
					<tr><td colspan="3" class="mute">Sem dados neste fecho.</td></tr>
				{/each}
			</tbody>
		</ScrollTable>
	{/if}
</Card>
{#if current.unofficial.length > 0}
	<SourceNote variant="warn">
		Estes valores não vêm da BODIVA: {current.unofficial.join(', ')}. Vêm da cópia do ticker em
		biccorretora.ao e podem estar desactualizados.
	</SourceNote>
{/if}
<SourceNote>{info[product].help}</SourceNote>

<SectionTitle title="Contas, custódia e volume por membro" hint="Mil milhões de kwanzas" />
<Card source={membersSource}>
	<Seg options={[...years]} bind:value={year} label="Ano" />

	<div class="table-gap">
		<ScrollTable caption="Contas, custódia e volume por membro em {year}">
			<thead>
				<tr>
					<th>Membro</th>
					<th class="r">Contas</th>
					<th class="r">Quota</th>
					<th class="r">Custódia</th>
					<th class="r">Volume</th>
				</tr>
			</thead>
			<tbody>
				{#each membersOfYear.rows as m (m.member)}
					<tr>
						<td><BrokerLogo src={logoPath(m.member)} name={m.name} /></td>
						<td class="r num">{formatNumber(m.accounts)}</td>
						<td class="r num">{formatPct(m.accounts_share_pct)}</td>
						<td class="r num">{formatNumber(m.custody_mm_kz, 2)}</td>
						<td class="r num">{formatNumber(m.volume_mm_kz, 2)}</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="mute">Sem dados para {year}.</td></tr>
				{/each}
			</tbody>
		</ScrollTable>
	</div>

	<SourceNote variant="warn">
		"—" quer dizer que o dado não foi capturado do relatório. Em 2025 não há contas nem custódia.
	</SourceNote>
	<SourceNote>
		Volume conta as duas pontas de cada operação. Uma compra entre dois membros soma no comprador e
		no vendedor.
	</SourceNote>
</Card>

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
	.pick {
		margin-top: 22px;
	}
	.table-gap {
		margin-top: 14px;
	}
</style>
