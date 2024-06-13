<script lang="ts">
	import { onMount } from 'svelte';
	import { data } from '$lib/data';
	import { PersonDetails, PersonImage } from '$lib/components';

	let all_people = [];
	let filter_people = [];
	let state_guess = 'correct';
	let keywords = '';
	let el_input_search = '';
	let person_selected = false;

	function filter(keywords) {
		person_selected = false;
		if (keywords === '') {
			filter_people = all_people;
			return;
		}

		try {
			const regex = new RegExp(keywords, 'i');
			filter_people = all_people.filter((person) => {
				return person.json.match(regex);
			});
		} catch (e) {
			filter_people = all_people;
		}

		if (filter_people.length === 1) {
			select(filter_people[0]);
		}
	}

	function select(person) {
		console.log('select', person);
		person_selected = person;
	}

	onMount(async () => {
		all_people = await data.loadPeople();
		all_people.sort((a, b) => a.name.localeCompare(b.name));
		filter_people = all_people;
		el_input_search.focus();
	});

	$: filter(keywords);

	$: console.log('person_selected', person_selected);
</script>

<nav>
	<input
		bind:value={keywords}
		placeholder="Type search/filter keywords"
		bind:this={el_input_search}
	/>
</nav>

<main>
	<section>
		<div class="section-inner">
			{#if filter_people.length === 0}
				<p>No people...</p>
			{/if}
			{#each filter_people as person}
				<div class="person" on:click={select(person)}>
					<button class="name" title={person.name}><span>✏️ {person.name}</span></button>
					<PersonImage {person} show_button={false} bind:state_guess />
				</div>
			{/each}
		</div>
	</section>
	{#if person_selected}
		<section class="edit">
			<div class="section-inner">
				<div class="img">
					<PersonImage person={person_selected} bind:state_guess />
				</div>
				<PersonDetails person={person_selected} bind:state_guess />
				<details>
					<summary>Raw JSON</summary>
					<textarea>{person_selected.json}</textarea>
				</details>
			</div>
		</section>
	{/if}
</main>

<style>
	main {
		width: 100%;
		display: flex;
		gap: 20px;
		flex-wrap: nowrap;
	}
	nav,
	section {
		width: auto;
		height: auto;
		background-color: #eee;
		padding: 10px;
		border-radius: 10px;
		display: flex;
	}
	section {
		padding: 20px;
		display: flex;
		min-width: 300px;
		max-width: 50%;
		height: calc(100vh - 170px);
	}
	section.edit {
		flex-direction: column;
		gap: 20px;
		flex-wrap: nowrap;
	}
	section.edit .img {
		width: 50%;
	}
	.section-inner {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		width: 100%;
		height: 100%;
		overflow: auto;
	}
	section.edit .section-inner {
		flex-direction: column;
		flex-wrap: nowrap;
	}
	.person {
		width: calc(25% - 20px);
		min-width: 150px;
		cursor: pointer;
	}
	button.name {
		font-size: 0.9em;
		display: block;
		width: 100%;
		padding: 5px;
		margin-bottom: 5px;
		cursor: pointer;
		text-align: left;
	}
	button.name span {
		display: block;
		width: 100%;
		white-space: nowrap;
		overflow: hidden;
	}
	summary {
		cursor: pointer;
	}
	textarea {
		width: 90%;
		height: 200px;
	}
</style>
