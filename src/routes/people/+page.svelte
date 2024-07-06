<script lang="ts">
	import { onMount } from 'svelte';
	import { dataInterface } from '$lib/data';
	import { csvInterface } from '$lib/csv';
	import { PersonDetails, PersonImage } from '$lib/components';
	import { PeopleStore } from '$lib/stores';

	let state_guess = 'correct';
	let keywords = '';
	let el_input_search;
	let person_selected = false;
	let el_file_csv_import;
	let files_csv_import;
	const filter_keywords = PeopleStore.filter_keywords;

	function exportCSV() {
		const csv_rows = csvInterface.export($PeopleStore.filtered);

		// Download the CSV file
		const csvContent = 'data:text/csv;charset=utf-8,' + csv_rows;
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', 'people.csv');
		document.body.appendChild(link); // Required for Firefox
		link.click();
	}

	function importCSVClick() {
		el_file_csv_import.value = null;
		el_file_csv_import.click();
	}

	function importCSV(event) {
		if (!event?.target?.files?.length) {
			alert('Unexpected Error 102: something went wrong with the file selection.');
			throw new Error('No files found in event: ', event);
		}

		const file = event.target.files[0];
		return csvInterface.import(file, $PeopleStore.all);
	}

	function select(person) {
		person_selected = person;
	}

	onMount(async () => {
		el_input_search.focus();

		await PeopleStore.load();

		PeopleStore.subscribe((data) => {
			person_selected = false;
			if (data.filtered.length === 1) {
				select(data.filtered[0]);
			}
		});
	});

	// TODO
	/*
	 */
</script>

<nav>
	<input
		bind:value={$filter_keywords}
		placeholder="Type search/filter keywords"
		bind:this={el_input_search}
	/>
</nav>

<nav>
	Quick Filter:
	<button
		on:click={() => {
			keywords = '"images":\\[\\]';
		}}>Missing Images</button
	>
</nav>

<nav>
	<button on:click={exportCSV}>Export CSV</button>
	<input
		type="file"
		id="file_csv_import"
		name="file_csv_import"
		placeholder="CSV File"
		accept="text/csv"
		style="display: none;"
		on:change={importCSV}
		bind:this={el_file_csv_import}
		bind:files={files_csv_import}
	/>
	<button on:click={importCSVClick}>Import CSV File</button>
</nav>

<main>
	<section>
		<div class="section-inner">
			{#if $PeopleStore.filtered.length === 0}
				<p>No people...</p>
			{/if}
			{#each $PeopleStore.filtered as person (person.id)}
				<div class="person">
					<button class="a11y" on:click={select(person)}>
						<PersonImage {person} show_buttons={false} bind:state_guess />
					</button>
					<div class="btn-container">
						<button class="name" title={person.name} on:click={select(person)}>
							<span>✏️ {person.name}</span>
						</button>
					</div>
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
					<textarea>{person_selected.__json}</textarea>
				</details>
			</div>
		</section>
	{/if}
</main>

<style>
	main {
		width: 100vw;
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
		gap: 10px;
	}
	section {
		padding: 20px;
		display: flex;
		min-width: 300px;
		width: 49%;
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
	.btn-container {
		width: 100%;
		border: 2px solid #ddd;
		border-radius: 0 0 10px 10px;
		display: flex;
		flex-direction: row;
	}
	button.a11y {
		border: 0;
		display: 0;
		display: block;
		width: 100%;
		padding: 0;
		margin: 0;
		cursor: pointer;
	}
	button.a11y:hover {
		opacity: 0.8;
	}
	button.name {
		cursor: pointer;
		font-size: 0.9em;
		display: block;
		width: 100%;
		border: 0;
		border-radius: 0 0 8px 8px;
		padding: 5px;
		cursor: pointer;
		text-align: left;
	}
	button.name:hover {
		background-color: #ddd;
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
