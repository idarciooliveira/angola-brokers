<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import SourceNote from '#lib/ui/SourceNote.svelte';
	import { purchaseCost } from '#lib/fees';
	import { formatDate, formatKz, formatPct } from '#lib/format';
	import { parseSimulatorQuery, simulateBill, toSimulatorSearch } from '#lib/simulator';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Começa com os valores por omissão, para o HTML do build mostrar essa simulação.
	// O URL só é lido depois de montar (o site é pré-gerado).
	let valor = $state<number | null>(untrack(() => data.defaults.valor));
	let prazo = $state(untrack(() => data.defaults.prazo));
	let corretora = $state(untrack(() => data.defaults.corretora));
	let mounted = $state(false);

	const valorKz = $derived(valor !== null && Number.isFinite(valor) && valor > 0 ? valor : 0);
	const bill = $derived(data.bills.find((b) => b.days === prazo));
	const broker = $derived(data.brokers.find((b) => b.slug === corretora));

	const sim = $derived.by(() => {
		if (valorKz <= 0 || !bill || !broker) return null;
		return simulateBill({
			amount: valorKz,
			ratePct: bill.ratePct,
			days: bill.days,
			purchaseCost: purchaseCost(broker, valorKz).total
		});
	});

	const asOf = $derived(formatDate(data.date));

	const netText = $derived(
		sim ? `${sim.net < 0 ? '− ' : '+ '}${formatKz(Math.abs(sim.net))}` : '—'
	);

	onMount(() => {
		const q = parseSimulatorQuery(
			window.location.search,
			{ prazos: data.bills.map((b) => b.days), corretoras: data.brokers.map((b) => b.slug) },
			data.defaults
		);
		valor = q.valor;
		prazo = q.prazo;
		corretora = q.corretora;
		mounted = true;
	});

	// Mantém o URL com o estado atual. Não cria entradas no histórico.
	// Um valor inválido não é escrito: o URL fica com o último válido.
	$effect(() => {
		if (!mounted || valorKz <= 0) return;
		const search = toSimulatorSearch({ valor: valorKz, prazo, corretora });
		untrack(() => replaceState(`${page.url.pathname}${search}`, page.state));
	});
</script>

<svelte:head>
	<title>Simulador | Painel BODIVA</title>
</svelte:head>

<p class="crumb">Quanto sobra no fim</p>
<h1>Simulador</h1>
<p class="lede">
	Compra de um Bilhete do Tesouro mantido até ao vencimento. Conta aproximada, não é uma promessa.
</p>

<div class="sim">
	<div class="card">
		<div class="fld">
			<label for="amt">Valor a investir (Kz)</label>
			<input
				id="amt"
				type="number"
				min="50000"
				step="50000"
				inputmode="numeric"
				bind:value={valor}
			/>
		</div>
		<div class="fld">
			<label for="term">Prazo</label>
			<select id="term" bind:value={prazo}>
				{#each data.bills as b (b.days)}
					<option value={b.days}>{b.days} dias, {formatPct(b.ratePct)} ao ano</option>
				{/each}
			</select>
		</div>
		<div class="fld">
			<label for="brk">Corretora</label>
			<select id="brk" bind:value={corretora}>
				{#each data.brokers as b (b.slug)}
					<option value={b.slug}>{b.broker}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="card" aria-live="polite">
		<span class="mute">Ganho líquido estimado</span>
		<div class="big" class:up={sim !== null && sim.net >= 0} class:down={sim !== null && sim.net < 0}>
			{netText}
		</div>

		<div class="ln">
			<span>Juros brutos em {bill?.days ?? '—'} dias</span>
			<b class="num">{sim ? formatKz(sim.gross) : '—'}</b>
		</div>
		<div class="ln">
			<span>Imposto sobre os juros (IAC 10%)</span>
			<b class="num down">{sim ? `− ${formatKz(sim.iac)}` : '—'}</b>
		</div>
		<div class="ln">
			<span>Custo de compra, {broker?.broker ?? '—'}</span>
			<b class="num down">{sim ? `− ${formatKz(sim.purchaseCost)}` : '—'}</b>
		</div>
		<div class="ln tot">
			<span>Retorno líquido ao ano</span>
			<b class="num">{formatPct(sim?.netAnnualPct)}</b>
		</div>

		{#if broker && (broker.stale || broker.uncertain)}
			<SourceNote variant="warn">
				<div class="warn">
					{#if broker.stale}
						<p>
							O preçário de {broker.broker} está desactualizado{broker.pricelist_date
								? `, de ${formatDate(broker.pricelist_date)}`
								: ''}. Confirma o custo com a corretora.
						</p>
					{/if}
					{#if broker.uncertain}
						<p>
							O preçário de {broker.broker} não diz se a BODIVA e a CEVAMA estão incluídas. A conta
							inclui as duas.
						</p>
					{/if}
				</div>
			</SourceNote>
		{/if}

		<SourceNote>A taxa muda a cada leilão. Comprar no mercado primário tem outro custo.</SourceNote>
	</div>
</div>

<SourceNote>
	Taxas dos Bilhetes vêm da cópia do ticker em biccorretora.ao, não da BODIVA. Dados de {asOf}.
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
	.sim {
		display: grid;
		grid-template-columns: 320px minmax(0, 1fr);
		gap: 12px;
		align-items: start;
		margin-top: 22px;
	}
	@media (max-width: 900px) {
		.sim {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.card {
		min-width: 0;
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 20px;
		background: var(--bg);
	}
	.mute {
		font-size: 12.5px;
		color: var(--mute);
	}
	.big {
		font-family: var(--serif);
		font-size: 44px;
		line-height: 1.1;
		letter-spacing: -0.01em;
		margin-block: 4px 14px;
		font-variant-numeric: tabular-nums;
	}
	.up {
		color: var(--up);
	}
	.down {
		color: var(--down);
	}
	.ln {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding-block: 11px;
		border-bottom: 1px solid var(--line);
	}
	.ln.tot {
		border-bottom: 0;
		font-size: 16px;
		font-weight: 600;
	}
	.num {
		font-variant-numeric: tabular-nums;
	}
	.warn p {
		margin: 0;
	}
	.warn p + p {
		margin-top: 6px;
	}
</style>
