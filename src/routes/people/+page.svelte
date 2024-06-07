<script lang="ts">
	import { onMount } from 'svelte';
	import { data } from '$lib/data';
	import { PersonDetails, PersonImage } from '$lib/components';

	let people = [];
	let state_guess = 'correct';
	let personImage;

	onMount(async () => {
		people = await data.loadPeople();
		people.sort((a, b) => a.name.localeCompare(b.name));
	});
</script>

<section>
	<div class="container-people">
		{#each people as person}
			<div class="person">
				<PersonImage {person} bind:state_guess bind:this={personImage} />
				<PersonDetails {person} {state_guess} />
			</div>
		{/each}
	</div>
</section>

<style>
	section {
		width: 100%;
		height: auto;
		background-color: #eee;
		padding: 10px;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
	}
	.container-people {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.person {
		width: 5%;
		min-width: 150px;
	}
</style>
