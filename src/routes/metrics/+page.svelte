<script lang="ts">
	import { onMount } from 'svelte';
	import { PeopleStore } from '$lib/stores';

	onMount(() => {
		PeopleStore.alphabetical = false;
		PeopleStore.load();
	});
</script>

<svelte:head>
	<title>Faces - Metrics</title>
	<meta
		name="description"
		content="Faces Metrics - gauge your progress learning the names of your contacts"
	/>
</svelte:head>

<div class="container">
	<h1>Metrics</h1>

	<h2>Overall</h2>
	{#if $PeopleStore.filtered_metrics.totals}
		<div class="metrics-grid">
			<div class="metric-card total">
				<h3>Total</h3>
				<p>{$PeopleStore.filtered_metrics.totals.all}</p>
			</div>
			<div class="metric-card new">
				<h3>New</h3>
				<p>{$PeopleStore.filtered_metrics.totals.new}</p>
				<small>{$PeopleStore.filtered_metrics.percents.new}%</small>
			</div>
			<div class="metric-card need-photo">
				<h3>Need Photo</h3>
				<p>{$PeopleStore.filtered_metrics.totals.need_photo}</p>
				<small>{$PeopleStore.filtered_metrics.percents.need_photo}%</small>
			</div>
			<div class="metric-card unknown">
				<h3>Unknown</h3>
				<p>{$PeopleStore.filtered_metrics.totals.unknown}</p>
				<small>{$PeopleStore.filtered_metrics.percents.unknown}%</small>
			</div>
			<div class="metric-card learning">
				<h3>Learning</h3>
				<p>{$PeopleStore.filtered_metrics.totals.learning}</p>
				<small>{$PeopleStore.filtered_metrics.percents.learning}%</small>
			</div>
			<div class="metric-card known">
				<h3>Known</h3>
				<p>{$PeopleStore.filtered_metrics.totals.known}</p>
				<small>{$PeopleStore.filtered_metrics.percents.known}%</small>
			</div>
		</div>
	{:else}
		<p>Loading...</p>
	{/if}

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
		padding: 20px;
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
	details {
		margin-top: 30px;
	}
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 15px;
		margin-top: 20px;
	}
	.metric-card {
		background-color: white;
		border-radius: 8px;
		padding: 15px;
		text-align: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.metric-card h3 {
		margin: 0 0 10px 0;
		font-size: 1em;
	}
	.metric-card p {
		font-size: 1.5em;
		font-weight: bold;
		margin: 0;
	}
	.metric-card small {
		font-size: 0.8em;
		color: #666;
	}
	.total { background-color: #e3f2fd; }
	.new { background-color: #e8f5e9; }
	.need-photo { background-color: #fff3e0; }
	.unknown { background-color: #ffebee; }
	.learning { background-color: #e0f2f1; }
	.known { background-color: #f3e5f5; }
</style>
