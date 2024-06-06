<script lang="ts">
	import { onMount } from 'svelte';
	import { data } from '$lib/data';

	let people = [];
	let totals = false;
	let percents = {};

	onMount(async () => {
		const metrics = await data.loadMetrics();
		people = metrics.people;
		totals = metrics.totals;
		percents = metrics.percents;
	});
</script>

<div class="container">
	<h1>Metrics</h1>

	<h2>Overall</h2>
	<p>
		{#if totals}
			<b>Total:</b>
			{totals.all}<br />
			<b>New:</b>
			{totals.new} ({percents.new}%)<br />
			<b>Need Photo</b>
			{totals.need_photo} ({percents.need_photo}%)<br />
			<b>Unknown</b>
			{totals.unknown} ({percents.unknown}%)<br />
			<b>Learning</b>
			{totals.learning} ({percents.learning}%)<br />
			<b>Known</b>
			{totals.known} ({percents.known}%)<br />
		{:else}
			Loading...
		{/if}
	</p>

	<details>
		<summary><h2>Full List With Tracking Data</h2></summary>
		<table>
			<tr>
				<th>Name</th>
				<th>Order Weight<br /><small>(How Well Known)</small></th>
				<th>Tracking</th>
			</tr>
			{#each people as person}
				<tr>
					<td>{person.name}</td>
					<td>{person.order_weight}</td>
					<td>
						{#each person.tracking.totals as total}
							<b>{total.guess}: </b>{total.guessCount}<br />
						{/each}
					</td>
				</tr>
			{/each}
		</table>
	</details>
</div>

<style>
	.container {
		background-color: #eee;
		padding: 10px;
		border-radius: 10px;
	}
	summary h2 {
		display: inline;
		margin: 0;
	}
	table {
		border-collapse: collapse;
	}
	td,
	th {
		border: 1px solid black;
		padding: 5px 10px;
	}
</style>
