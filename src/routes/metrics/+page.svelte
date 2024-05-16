<script lang="ts">
	import { onMount } from 'svelte';
	import { data } from '$lib/data';

	let people = [];

	onMount(async () => {
		people = await data.loadPeopleOrdered();
		console.log(people);
	});
</script>

<div class="container">
	<h1>Metrics</h1>

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
		padding: 20px;
	}
	summary h2 {
		display: inline;
		margin: 0;
	}
</style>
