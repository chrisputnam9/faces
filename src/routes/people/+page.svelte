<script lang="ts">
	import { onMount } from 'svelte';
	import { dataInterface } from '$lib/data';
	import { csvInterface } from '$lib/csv';
	import { utilsFrontend } from '$lib/utilsFrontend';
	import { PersonDetails, PersonImage } from '$lib/components';
	import { PeopleStore } from '$lib/stores';
	import {
		DATA_SYNC_SAVE_STATE,
		/*dataSyncAlert,*/
		dataSyncIsAvailableForSignIn,
		dataSyncIsSignedIn,
		dataSyncSaveState
		/*dataSyncMessageShow*/
	} from '$lib/stores/data_stores';
	import { google_drive } from '$lib/google_drive';

	let emailLocalStore;

	let state_guess = 'correct';
	let el_input_search;
	let person_selected = false;
	let el_people_csv_import;
	let files_people_csv_import;
	let el_tracking_json_import;
	let files_tracking_json_import;
	const filter_keywords = PeopleStore.filter_keywords;

	function exportPeopleCSV() {
		const csv_rows = csvInterface.export($PeopleStore.filtered);

		// TODO
		utilsFrontend.downloadFile('people.csv', csv_rows, 'text/csv');
	}

	function importPeopleCSVClick() {
		el_people_csv_import.value = null;
		el_people_csv_import.click();
	}

	function importPeopleCSV(event) {
		if (!event?.target?.files?.length) {
			alert('Unexpected Error 102: something went wrong with the file selection.');
			throw new Error('No files found in event: ', event);
		}

		const file = event.target.files[0];
		return csvInterface.import(file, $PeopleStore.all);
	}

	async function exportTrackingJson() {
		const tracking = await dataInterface.loadTracking();

		utilsFrontend.downloadFile('tracking.json', JSON.stringify(tracking), 'application/json');
	}

	function importTrackingJSONClick() {
		el_tracking_json_import.value = null;
		el_tracking_json_import.click();
	}

	function importTrackingJSON(event) {
		if (!event?.target?.files?.length) {
			alert('Unexpected Error 103: something went wrong with the file selection.');
			throw new Error('No files found in event: ', event);
		}

		const file = event.target.files[0];

		var reader = new FileReader();
		reader.onload = function (evt) {
			let tracking;
			try {
				tracking = JSON.parse(evt.target.result);
			} catch (e) {
				const message = 'Error 105 - unable to parse file - it may be corrupted';
				alert(message);
				console.error(message, e);
				return;
			}
			dataInterface.saveTracking(tracking);
			alert('Tracking imported successfully - now saving');
		};
		reader.onerror = function (evt) {
			const message = 'Error 104 - unable to read file';
			alert(message);
			console.error(message, evt);
		};
		reader.readAsText(file, 'UTF-8');
	}

	function select(person) {
		person_selected = person;
	}

	onMount(async () => {
		el_input_search.focus();

		PeopleStore.alphabetical = true;
		await PeopleStore.load();

		PeopleStore.subscribe((data) => {
			person_selected = false;
			if (data.filtered.length === 1) {
				select(data.filtered[0]);
			}
		});

		google_drive.initLocalStores();
		emailLocalStore = google_drive.emailLocalStore;
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
			$filter_keywords = '';
		}}>All</button
	>
	<button
		on:click={() => {
			$filter_keywords = '"images":\\[\\]';
		}}>Missing Images</button
	>
</nav>

<nav>
	<button on:click={exportPeopleCSV}>Export People to CSV</button>
	<input
		type="file"
		id="people_csv_import"
		name="people_csv_import"
		placeholder="People CSV File"
		accept="text/csv"
		style="display: none;"
		on:change={importPeopleCSV}
		bind:this={el_people_csv_import}
		bind:files={files_people_csv_import}
	/>
	<button on:click={importPeopleCSVClick}>Import People from CSV File</button>
</nav>

<nav>
	<button on:click={exportTrackingJson}>Export Tracking to JSON</button>
	<input
		type="file"
		id="file_tracking_json_import"
		name="file_tracking_json_import"
		placeholder="Tracking JSON File"
		accept="application/json"
		style="display: none;"
		on:change={importTrackingJSON}
		bind:this={el_tracking_json_import}
		bind:files={files_tracking_json_import}
	/>
	<button on:click={importTrackingJSONClick}>Import Tracking from JSON File</button>
</nav>

<nav>
	{#if $dataSyncIsSignedIn}
		<button
			disabled={$dataSyncSaveState != DATA_SYNC_SAVE_STATE.PENDING}
			on:click={dataInterface.syncToGoogleDrive}
		>
			{#if $dataSyncSaveState == DATA_SYNC_SAVE_STATE.PENDING}
				Sync with Google Drive
			{:else if $dataSyncSaveState == DATA_SYNC_SAVE_STATE.PENDING_LOGIN}
				Pending Login - This shouldn't show...
			{:else if $dataSyncSaveState == DATA_SYNC_SAVE_STATE.SAVING}
				Syncing...
			{:else if $dataSyncSaveState == DATA_SYNC_SAVE_STATE.SUCCESS}
				Sync Complete
			{:else if $dataSyncSaveState == DATA_SYNC_SAVE_STATE.ERROR}
				Sync Failed
			{:else}
				Sync Save State Error
			{/if}
		</button>
		<button on:click={google_drive.logOut}> Log Out of Google Drive </button>
	{:else}
		<input
			bind:value={$emailLocalStore}
			placeholder="Email (optional)"
			title="Email (optional 'remember me' for faster logins). This cannot be used to switch accounts - use Google's login interface to switch first."
		/>
		<button disabled={!$dataSyncIsAvailableForSignIn} on:click={google_drive.logIn}>
			{#if $dataSyncIsAvailableForSignIn}
				Log In - Sync to Google Drive
			{:else}
				Loading...
			{/if}
		</button>
	{/if}
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
