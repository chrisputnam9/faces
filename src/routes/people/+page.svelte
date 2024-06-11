<script lang="ts">
	import { onMount } from 'svelte';
	import { data } from '$lib/data';
	import { PersonDetails, PersonImage } from '$lib/components';

	let all_people = [];
	let filter_people = [];
	let state_guess = 'correct';
	let personImage;
	let keywords = '';
	let el_input_search;

	function filter(keywords) {
		if (keywords === '') {
			filter_people = all_people;
			return;
		}
		const regex = new RegExp(keywords, 'i');
		filter_people = all_people.filter((person) => {
			return person.json.match(regex);
		});
	}

	onMount(async () => {
		all_people = await data.loadPeople();
		all_people.sort((a, b) => a.name.localeCompare(b.name));
		filter_people = all_people;
		el_input_search.focus();
	});

	$: filter(keywords);
</script>

<nav>
	<input
		bind:value={keywords}
		placeholder="Type search/filter keywords"
		bind:this={el_input_search}
	/>
</nav>

<section>
	<div class="container-people">
		{#each filter_people as person}
			<div class="person">
				<h1>{person.name}</h1>
				<PersonImage {person} bind:state_guess bind:this={personImage} />
			</div>
		{/each}
	</div>
</section>

<style>
	nav,
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
		gap: 30px;
	}
	.person {
		width: 5%;
		min-width: 150px;
	}
	h1 {
		font-size: 1em;
		text-align: center;
	}
</style>
