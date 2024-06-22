<script lang="ts">
	import Papa from 'papaparse';
	import { onMount } from 'svelte';
	import { data } from '$lib/data';
	import { PersonDetails, PersonImage } from '$lib/components';

	let all_people = [];
	let filter_people = [];
	let state_guess = 'correct';
	let keywords = '';
	let el_input_search;
	let person_selected = false;
	let el_file_csv_import;
	let files_csv_import;

	function filter(keywords) {
		person_selected = false;
		if (keywords === '') {
			filter_people = all_people;
			return;
		}

		try {
			const regex = new RegExp(keywords, 'i');
			filter_people = all_people.filter((person) => {
				return person.__json.match(regex);
			});
		} catch (e) {
			filter_people = all_people;
		}

		if (filter_people.length === 1) {
			select(filter_people[0]);
		}
	}

	function select(person) {
		person_selected = person;
	}

	function exportCSV() {
		const errors = [];
		const people_prepared = [];
		for (const person of filter_people) {
			const person_prepared = {};
			for (const key in person) {
				// By convention __ prefixed keys are not part of the actual 'data'
				if (key.substr(0, 2) === '__') continue;
				const value = person[key];
				const type = typeof value;
				let value_prepared = value;
				if (value === null) {
					value_prepared = '';
				} else if (Array.isArray(value)) {
					// If it's an array of Objects - change each Object to JSON
					if (typeof value[0] === 'object') {
						value_prepared = JSON.stringify(value);
					}
					// Otherwise, good to go - leave it as-is and parser will take care of it
				} else if (['number', 'string', 'boolean'].includes(type)) {
					// Good to go - leave it as-is and parser will take care of it
				} else {
					errors.push('Unexpected value type for key:"' + key + '" of person:' + person.id);
				}
				person_prepared[key] = value_prepared;
			}
			people_prepared.push(person_prepared);
		}
		if (errors.length > 0) {
			alert('Error 101: Issues with data need to be resolved - see console');
			throw new Error('Issues with data need to be resolved:\n - ' + errors.join('\n - '));
		}

		// Generate the CSV contents
		const csv = Papa.unparse(people_prepared);

		// Download the CSV file
		const csvContent = 'data:text/csv;charset=utf-8,' + csv;
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
		if (file.type !== 'text/csv') {
			alert('Unexpected Error 103: Only CSV files are supported by import at this time.');
			throw new Error('Unexpected file type: ', file);
		}

		const errors = [];
		const regex_json = /^\[.*\]$/i;

		const data = Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			encoding: 'utf-8',
			worker: false,

			transform: function (value, header) {
				value = value.trim();

				// Convert comma separated strings to arrays
				if (['aliases', 'companies', 'emails', 'phones', 'images'].includes(header)) {
					value = value.split(',').filter((v) => v.trim() !== '');
				}

				// Convert JSON strings
				if (['facts', 'links'].includes(header)) {
					let error = false;
					let parsed_value = '';

					if (!value.match(regex_json)) error = 'Does not look like JSON array';

					if (!error) {
						try {
							parsed_value = JSON.parse(value);
						} catch (e) {
							error = 'Failed to parse JSON';
						}
					}

					if (!error) {
						if (!Array.isArray(parsed_value)) error = 'Parsed result was not an array';
					}

					if (!error) {
						return parsed_value;
					}

					errors.push(`Unexpected value for ${header} (${error}): ${value}`);

					return value;
				}

				return value;
			},

			complete: function (results, file) {
				if (errors.length > 0) {
					alert('Error 105: Issues with some CSV data need to be resolved - see console');
					throw new Error(
						'Issues with some CSV data need to be resolved:\n - ' + errors.join('\n - ')
					);
				}

				// TODO
				// alert('Successfully imported ' + results.data.length + ' people from CSV file.');

				// Test
				console.clear();
				console.log('Success!');
				console.log(results);
				const imported_string = JSON.stringify(results.data[0]);
				console.log(imported_string);

				const temp_compare = structuredClone(all_people[0]);
				delete temp_compare.__json;
				const existing_string = JSON.stringify(temp_compare);
				console.log(existing_string);

				if (imported_string === existing_string) {
					console.log('SUCCESS!');
				} else {
					throw new Error('Imported data does not match existing data');
				}
			},

			error: function (error, file) {
				alert('Error 104: There was an issue parsing the CSV file.');
				console.error('Error parsing CSV file: ', error);
			}
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
			{#if filter_people.length === 0}
				<p>No people...</p>
			{/if}
			{#each filter_people as person}
				<div class="person">
					<button class="a11y" on:click={select(person)}>
						<PersonImage bind:person show_buttons={false} bind:state_guess />
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
