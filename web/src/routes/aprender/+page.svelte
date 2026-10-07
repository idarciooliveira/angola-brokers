<script lang="ts">
	import Card from '#lib/ui/Card.svelte';
	import ScrollTable from '#lib/ui/ScrollTable.svelte';
	import SourceNote from '#lib/ui/SourceNote.svelte';

	const products = [
		{
			title: 'Bilhete do Tesouro',
			desc: 'Emprestas ao Estado por 91 a 364 dias.',
			risk: 1,
			line: 'Rende 9,5% a 17,5% ao ano. Sabes quanto recebes e quando.'
		},
		{
			title: 'Obrigação do Tesouro',
			desc: 'Empréstimo ao Estado a vários anos, com juros pagos de tempos a tempos.',
			risk: 2,
			line: 'O preço mexe. Podes vender antes do fim.'
		},
		{
			title: 'Acções',
			desc: 'Ficas sócio de uma empresa cotada. Só há 7.',
			risk: 4,
			line: 'Podes perder parte do dinheiro e esperar anos.'
		},
		{
			title: 'Fundos',
			desc: 'Um gestor junta o dinheiro de várias pessoas e investe por todos.',
			risk: 3,
			line: 'Quem investe está isento de IAC.'
		}
	];

	const blocks = [1, 2, 3, 4, 5];

	const terms = [
		{
			title: 'Corretora',
			desc: 'Empresa autorizada que compra e vende por ti na BODIVA.'
		},
		{
			title: 'Custódia',
			desc: 'A conta onde ficam registados os teus títulos, na CEVAMA.'
		},
		{
			title: 'Mercado secundário',
			desc: 'Compras a outro investidor, não ao Estado. Podes vender antes do fim.'
		},
		{
			title: 'Mercado bilateral',
			desc: 'Duas partes negociam entre si. Pesa 87% do valor negociado.'
		}
	];
</script>

<svelte:head>
	<title>Aprender | Painel BODIVA</title>
</svelte:head>

<p class="crumb">Para quem está a começar</p>
<h1>Aprender</h1>
<p class="lede">Os quatro tipos de produto e os impostos que vais ver.</p>

<h2>Onde pôr o dinheiro</h2>
<div class="grid four">
	{#each products as p (p.title)}
		<article class="card product">
			<h3>{p.title}</h3>
			<div class="risk" role="img" aria-label="Risco {p.risk} de 5">
				{#each blocks as i (i)}
					<i class:f={i <= p.risk}></i>
				{/each}
			</div>
			<p class="desc">{p.desc}</p>
			<p class="line">{p.line}</p>
		</article>
	{/each}
</div>

<h2>Impostos e taxas</h2>
<Card title="Quanto se paga, e onde">
	<ScrollTable caption="Impostos e taxas aplicados aos investidores">
		<thead>
			<tr><th>Imposto</th><th class="r">Taxa</th><th>Onde se aplica</th></tr>
		</thead>
		<tbody>
			<tr><td>IVA</td><td class="r num">14%</td><td>Comissões da corretora</td></tr>
			<tr>
				<td>IAC sobre juros</td>
				<td class="r num">10%, ou 5%</td>
				<td>5% em obrigações com 3 anos ou mais, negociadas em mercado</td>
			</tr>
			<tr>
				<td>IAC sobre mais-valias</td>
				<td class="r num">10%, ou 5%</td>
				<td>5% quando realizadas em mercado, em obrigações longas e em acções</td>
			</tr>
			<tr>
				<td>Taxa de Supervisão Contínua</td>
				<td class="r num">0,0111%</td>
				<td>Novo desde Setembro. Retida pela corretora ao pagar o rendimento.</td>
			</tr>
		</tbody>
	</ScrollTable>
	<SourceNote>Fundos: quem investe está isento de IAC. Fonte: guia de investimento da CMC.</SourceNote>
	<SourceNote variant="warn">
		O IAC sobre dividendos (10%) vem de fontes secundárias e não está confirmado. Não sabemos ainda se a
		Taxa de Supervisão Contínua é repassada ao cliente ou absorvida pela corretora.
		<a href="/fontes">Ver de onde vem cada número</a>.
	</SourceNote>
</Card>

<h2>Palavras comuns</h2>
<div class="grid two">
	{#each terms as t (t.title)}
		<article class="card">
			<h3>{t.title}</h3>
			<p class="desc">{t.desc}</p>
		</article>
	{/each}
</div>

<SourceNote>
	Esta página é informação geral sobre o mercado, não é aconselhamento financeiro.
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
	h2 {
		font-size: 26px;
		margin: 44px 0 14px;
	}
	p {
		margin: 0;
	}
	.grid {
		display: grid;
		gap: 12px;
	}
	.four {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.two {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.card {
		display: grid;
		align-content: start;
		gap: 8px;
		min-width: 0;
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 20px;
		background: var(--bg);
	}
	.product h3 {
		font-family: var(--serif);
		font-size: 20px;
		font-weight: 400;
		line-height: 1.25;
	}
	h3 {
		margin: 0;
		font-family: var(--sans);
		font-size: 14px;
		font-weight: 600;
		line-height: 1.4;
	}
	.desc {
		font-size: 13px;
		color: var(--mute);
	}
	.line {
		font-size: 13px;
		font-weight: 500;
		color: var(--ink);
	}
	.risk {
		display: flex;
		gap: 3px;
	}
	.risk i {
		width: 18px;
		height: 6px;
		border-radius: 2px;
		background: var(--line);
	}
	.risk i.f {
		background: var(--brand);
	}
	.num {
		font-variant-numeric: tabular-nums;
	}
	a {
		color: var(--brand-ink);
	}
	@media (max-width: 900px) {
		.four {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 520px) {
		.four,
		.two {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
