<script lang="ts">
	import Card from '#lib/ui/Card.svelte';
	import Chip from '#lib/ui/Chip.svelte';
	import ScrollTable from '#lib/ui/ScrollTable.svelte';
	import SourceNote from '#lib/ui/SourceNote.svelte';
	import { formatDate, formatKz, formatNumber, formatPct } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const years = ['2025', '2026'] as const;
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
<p class="lede">Preços e taxas do fecho de {formatDate(data.date)}. Cada cartão diz de onde vêm os números.</p>

<div class="grid">
	<Card
		title="Bilhetes do Tesouro"
		subtitle="Taxa anual, por prazo."
		source={data.bills.source}
	>
		<ScrollTable caption="Bilhetes do Tesouro por prazo">
			<thead>
				<tr><th>Prazo</th><th class="r">Taxa anual</th></tr>
			</thead>
			<tbody>
				{#each data.bills.items as b (b.code)}
					<tr>
						<td>{b.days} dias</td>
						<td class="r num">{formatPct(b.rate)}</td>
					</tr>
				{:else}
					<tr><td colspan="2" class="mute">Sem dados neste fecho.</td></tr>
				{/each}
			</tbody>
		</ScrollTable>
		<SourceNote>
			Ao comprar um Bilhete emprestas dinheiro ao Estado e recebes mais no fim do prazo.
		</SourceNote>
		{#if data.bills.unofficial.length > 0}
			<SourceNote variant="warn">
				Estes valores não vêm da BODIVA: {data.bills.unofficial.join(', ')}. Vêm da cópia do ticker em
				biccorretora.ao e podem estar desactualizados.
			</SourceNote>
		{/if}
	</Card>

	<Card
		title="Obrigações do Tesouro"
		subtitle="Preço em % do valor nominal, por ano de vencimento."
		source={data.ots.source}
	>
		<ScrollTable caption="Obrigações do Tesouro por ano de vencimento">
			<thead>
				<tr>
					<th>Título</th>
					<th>Vence</th>
					<th class="r">Preço</th>
					<th class="r">Variação</th>
				</tr>
			</thead>
			<tbody>
				{#each data.ots.items as o (o.code)}
					<tr>
						<td><strong>{o.code}</strong></td>
						<td>{o.year ?? '—'}</td>
						<td class="r num">{formatNumber(o.price, 2)}</td>
						<td class="r"><Chip value={o.change} /></td>
					</tr>
				{:else}
					<tr><td colspan="4" class="mute">Sem dados neste fecho.</td></tr>
				{/each}
			</tbody>
		</ScrollTable>
		<SourceNote>O ano de vencimento vem do código do título. OJ10M28A vence em 2028.</SourceNote>
		{#if data.ots.unofficial.length > 0}
			<SourceNote variant="warn">
				Estes preços não vêm da BODIVA: {data.ots.unofficial.join(', ')}. Vêm da cópia do ticker em
				biccorretora.ao e podem estar desactualizados.
			</SourceNote>
		{/if}
	</Card>

	<Card
		title="Obrigações privadas"
		subtitle="Preço em % do valor nominal."
		source={data.corp.source}
	>
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
		{#if data.corp.unofficial.length > 0}
			<SourceNote variant="warn">
				Estes preços não vêm da BODIVA: {data.corp.unofficial.join(', ')}. Vêm da cópia do ticker em
				biccorretora.ao e podem estar desactualizados.
			</SourceNote>
		{/if}
	</Card>

	<Card
		title="Acções"
		subtitle="Preço em kwanzas, do mais caro para o mais barato."
		source={data.stocks.source}
	>
		<ScrollTable caption="Acções cotadas na BODIVA">
			<thead>
				<tr><th>Acção</th><th class="r">Preço</th><th class="r">Variação</th></tr>
			</thead>
			<tbody>
				{#each data.stocks.items as s (s.code)}
					<tr>
						<td><strong>{s.code}</strong> <span class="mute">{s.name}</span></td>
						<td class="r num">{formatKz(s.price)}</td>
						<td class="r"><Chip value={s.change} /></td>
					</tr>
				{:else}
					<tr><td colspan="3" class="mute">Sem dados neste fecho.</td></tr>
				{/each}
			</tbody>
		</ScrollTable>
		{#if data.stocks.unofficial.length > 0}
			<SourceNote variant="warn">
				Estes preços não vêm da BODIVA: {data.stocks.unofficial.join(', ')}. Vêm da cópia do ticker em
				biccorretora.ao e podem estar desactualizados.
			</SourceNote>
		{/if}
	</Card>

	<div class="wide">
		<Card
			title="Contas, custódia e volume por membro"
			subtitle="Mil milhões de kwanzas. Escolhe o ano."
			source={membersSource}
		>
			<div class="seg" role="group" aria-label="Ano">
				{#each years as y (y)}
					<button type="button" aria-pressed={year === y} onclick={() => (year = y)}>{y}</button>
				{/each}
			</div>

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
								<td>{m.name}</td>
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
	</div>
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
	.seg {
		display: inline-flex;
		background: var(--soft);
		border-radius: 99px;
		padding: 3px;
	}
	.seg button {
		border: 0;
		background: none;
		padding: 6px 14px;
		border-radius: 99px;
		font-size: 13px;
		cursor: pointer;
	}
	.seg button[aria-pressed='true'] {
		background: #fff;
		box-shadow: 0 0 0 1px var(--line);
	}
	@media (max-width: 900px) {
		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
