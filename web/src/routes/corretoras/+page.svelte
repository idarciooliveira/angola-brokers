<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import Card from '#lib/ui/Card.svelte';
	import Seg from '#lib/ui/Seg.svelte';
	import FreshnessBadge from '#lib/ui/FreshnessBadge.svelte';
	import ScrollTable from '#lib/ui/ScrollTable.svelte';
	import SourceNote from '#lib/ui/SourceNote.svelte';
	import { purchaseCost } from '#lib/fees';
	import { formatDate, formatKz, formatNumber, formatPct } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let amount = $state<number | null>(5000000);
	let filter = $state<'ok' | 'all'>('ok');
	const open = new SvelteSet<string>();

	const amountKz = $derived(amount !== null && Number.isFinite(amount) && amount > 0 ? amount : 0);

	const rows = $derived.by(() => {
		const visible = filter === 'ok' ? data.brokers.filter((b) => b.current) : data.brokers;
		return visible
			.map((b) => ({ b, cost: purchaseCost(b, amountKz) }))
			.sort((x, y) => x.cost.total - y.cost.total);
	});

	const maxTotal = $derived(Math.max(0, ...rows.map((r) => r.cost.total)));

	function toggle(name: string) {
		if (open.has(name)) open.delete(name);
		else open.add(name);
	}
</script>

<svelte:head>
	<title>Corretoras | Painel BODIVA</title>
</svelte:head>

<p class="crumb">Quem compra por ti</p>
<h1>Corretoras</h1>
<p class="lede">
	O custo de comprar Obrigações do Tesouro no mercado secundário, calculado para o valor que
	escolhes. Ordenado do mais barato para o mais caro.
</p>

<div class="card-wrap">
	<Card source="Preçários das corretoras, verificados em {formatDate(data.checkedOn)}; contas e volume da BODIVA">
		<div class="controls">
			<div class="fld">
				<label for="amt">Valor da compra (Kz)</label>
				<input
					id="amt"
					type="number"
					min="50000"
					step="50000"
					inputmode="numeric"
					bind:value={amount}
				/>
			</div>
			<Seg
				options={[
					{ value: 'ok', label: 'Preçário actual' },
					{ value: 'all', label: 'Todas' }
				]}
				bind:value={filter}
				label="Que preçários mostrar"
			/>
		</div>

		<ScrollTable caption="Custo de comprar Obrigações do Tesouro por corretora">
			<thead>
				<tr>
					<th>Corretora</th>
					<th class="r">Custo</th>
					<th>Comparação</th>
					<th class="r">% do valor</th>
					<th>Preçário</th>
					<th><span class="sr">Detalhes</span></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as { b, cost }, i (b.broker)}
					{@const isOpen = open.has(b.broker)}
					<tr class:best={i === 0}>
						<td><strong>{b.broker}</strong></td>
						<td class="r num"><strong>{formatKz(cost.total)}</strong></td>
						<td>
							<div class="bar">
								<i style:width="{maxTotal > 0 ? (cost.total / maxTotal) * 100 : 0}%"></i>
							</div>
						</td>
						<td class="r num">{amountKz > 0 ? formatPct((cost.total / amountKz) * 100) : '—'}</td>
						<td>
							{#if b.stale}
								<FreshnessBadge state="stale" date={b.pricelist_date ?? undefined} />
							{:else if b.uncertain}
								<span
									title="O preçário não diz se a BODIVA e a CEVAMA estão incluídas. O custo conta as duas."
								>
									<FreshnessBadge state="uncertain" />
								</span>
							{:else if b.pricelist_date === null}
								<span class="badge q">sem data</span>
							{:else}
								<FreshnessBadge state="ok" date={b.pricelist_date} />
							{/if}
						</td>
						<td class="r">
							<button
								type="button"
								class="more"
								aria-expanded={isOpen ? 'true' : 'false'}
								onclick={() => toggle(b.broker)}
							>
								{isOpen ? 'Menos' : 'Detalhes'}
							</button>
						</td>
					</tr>
					{#if isOpen}
						<tr class="det">
							<td colspan="6">
								<div class="dl">
									<div>
										<span>Contas em 2026</span>
										{b.accounts === null ? 'não capturado' : formatNumber(b.accounts)}
									</div>
									<div>
										<span>Volume em 2026 (mil milhões de Kz)</span>
										{b.volume_mm_kz === null ? 'não capturado' : formatNumber(b.volume_mm_kz, 0)}
									</div>
									<div>
										<span>Comissão sobre juros</span>
										{b.dividend_fee ?? '—'}
									</div>
									<div>
										<span>Manutenção de conta</span>
										{b.maintenance ?? '—'}
									</div>
									<div>
										<span>Preçário verificado em</span>
										{formatDate(b.checked_on)}
									</div>
									<div>
										<span>Preçário</span>
										{#if b.source_url}
											<a href={b.source_url} target="_blank" rel="noopener noreferrer">Ver preçário</a>
										{:else}
											sem link
										{/if}
									</div>
								</div>
								{#if b.note}<p class="obs">{b.note}</p>{/if}
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</ScrollTable>
		<SourceNote>
			Custo = comissão da corretora + BODIVA + CEVAMA + IVA de 14%. É só a compra, a venda custa
			parecido. Os preçários mudam e alguns estão desactualizados, por isso confirma com a corretora.
		</SourceNote>
		<SourceNote variant="warn">
			Com "Preçário actual" ficam de fora os preçários antigos, por confirmar ou sem data. "Todas"
			mostra-os, com etiqueta.
		</SourceNote>
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
	.card-wrap {
		margin-top: 22px;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 16px 28px;
		align-items: end;
		margin-bottom: 12px;
	}
	.fld {
		width: 200px;
		max-width: 100%;
		margin: 0;
	}
	.num {
		font-variant-numeric: tabular-nums;
	}
	.bar {
		height: 6px;
		min-width: 80px;
		background: var(--soft);
		border-radius: 3px;
		overflow: hidden;
	}
	.bar i {
		display: block;
		height: 100%;
		background: var(--brand);
		border-radius: 3px;
	}
	.best td:first-child {
		box-shadow: inset 3px 0 0 var(--brand);
	}
	.badge {
		display: inline-block;
		font-size: 12px;
		border-radius: 99px;
		padding: 1px 9px;
		white-space: nowrap;
	}
	.q {
		background: var(--warn-soft);
		color: var(--warn);
	}
	.more {
		border: 0;
		background: none;
		color: var(--brand);
		font: inherit;
		font-size: 12.5px;
		padding: 0;
		cursor: pointer;
	}
	.det td {
		background: var(--soft);
		padding: 14px 16px;
	}
	.dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: 12px;
	}
	.dl span {
		display: block;
		font-size: 12px;
		color: var(--mute);
	}
	.obs {
		margin-top: 12px;
		font-size: 12.5px;
		color: var(--mute);
	}
</style>
