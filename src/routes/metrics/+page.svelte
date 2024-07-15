<script lang="ts">
	import { onMount } from 'svelte';
	import { dataInterface } from '$lib/data';
	import { PeopleStore } from '$lib/stores';

	onMount(() => {
		PeopleStore.alphabetical = false;
		PeopleStore.load();
	});
</script>

<div class="container">
	<h1>Metrics</h1>

	<h2>Overall</h2>
	<p>
		{#if $PeopleStore.filtered_metrics.totals}
			<b>Total:</b>
			{$PeopleStore.filtered_metrics.totals.all}<br />
			<b>New:</b>
			{$PeopleStore.filtered_metrics.totals.new} ({$PeopleStore.filtered_metrics.percents.new}%)<br
			/>
			<b>Need Photo</b>
			{$PeopleStore.filtered_metrics.totals.need_photo} ({$PeopleStore.filtered_metrics.percents
				.need_photo}%)<br />
			<b>Unknown</b>
			{$PeopleStore.filtered_metrics.totals.unknown} ({$PeopleStore.filtered_metrics.percents
				.unknown}%)<br />
			<b>Learning</b>
			{$PeopleStore.filtered_metrics.totals.learning} ({$PeopleStore.filtered_metrics.percents
				.learning}%)<br /> <b>Known</b>
			{$PeopleStore.filtered_metrics.totals.known} ({$PeopleStore.filtered_metrics.percents
				.known}%)<br />
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
			{#each $PeopleStore.filtered as person (person.id)}
				<tr>
					<td>{person.name}</td>
					<td>{person.__order_weight}</td>
					<td>
						{#each person.__tracking.totals as total}
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
