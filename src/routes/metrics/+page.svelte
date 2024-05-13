<script lang="ts">
	import { onMount } from 'svelte';
	import { data } from '$lib/data';

	let people = [];

	onMount(async () => {
		people = await data.loadPeopleOrdered();
	});
</script>

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
					<b>{total.guess}: </b>{total.count}<br />
				{/each}
			</td>
		</tr>
	{/each}
</table>
