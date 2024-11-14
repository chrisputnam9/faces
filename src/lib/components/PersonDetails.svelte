<script lang="ts">
	import { aiInterface } from '$lib/ai';
	export let person = null;
	export let state_guess = false;

	let person_company_search = '';
	let person_search = '';
	let person_name_words = [];

	let ai_help_by_word = {};
	let ai_help_in_progress = false;
	let ai_help_error = false;

	async function get_ai_help() {
		ai_help_in_progress = true;
		for (const word of person_name_words) {
			const ai_help = await aiInterface.get_similar_words(word);
			console.log(ai_help);
			ai_help_by_word[word] = ai_help;
		}
		ai_help_by_word = ai_help_by_word;
		ai_help_in_progress = false;
	}

	// Set person search string for social sites
	$: person_company_search = person ? person.name + ' ' + person.companies.join(' ') : '';
	$: person_search = person ? person.name : '';
	$: person_name_words = person
		? person.name
				.toLowerCase()
				.trim()
				.replace(/\s+/g, '-')
				.replace(/[^a-z0-9-]+/g, '')
				.split('-')
		: [];
</script>

<div class="details state-guess-{state_guess}">
	<h1>
		{person.name}
		<br />
		{#if person.companies.length > 0}<small>({person.companies.join(', ')})</small>{/if}
	</h1>

	<h2>AI Assistance:</h2>
	<p>{person_name_words.join(', ')}</p>
	{#each person_name_words as word}
		{#if word in ai_help_by_word}
			<p>{ai_help_by_word[word]}</p>
		{:else}
			<p>
				<button on:click={get_ai_help} disabled={ai_help_in_progress}>
					{#if ai_help_in_progress}
						Getting help...
					{:else}
						Help me remember '{word}'
					{/if}
				</button>
			</p>
		{/if}
	{/each}
	{#if ai_help_error}
		<p>AI Assistance failed - {ai_help_error}</p>
	{/if}
	<hr />

	<p>
		{#each person.facts as fact}
			<br /><b>{fact.name}:</b> {fact.value}
		{/each}
		{#each person.emails as email}
			<br /><b>Email:</b> <a href="mailto:{email}" target="_blank">{email}</a>
		{/each}
	</p>

	<p>
		<!-- Trusted user input only used by the user -->
		<!-- eslint-disable svelte/no-at-html-tags -->
		{@html person.description.replace(/\n/g, '<br />')}
	</p>

	<b>Links:</b>
	<ul>
		{#each person.links as link}
			<li>
				<a href={link.url} target="_blank">{link.text}</a>
			</li>
		{/each}
		<li>
			<a href="https://www.google.com/search?q=name meaning {person.first_name}" target="_blank"
				>Meaning of name "{person.first_name}"</a
			>
		</li>
		<li>
			<a href="https://www.google.com/search?q=name meaning {person.last_name}" target="_blank"
				>Meaning of name "{person.last_name}"</a
			>
		</li>
		<li>
			<a href="https://www.facebook.com/search/top/?q={person_company_search}" target="_blank"
				>Facebook</a
			>
		</li>
		<li>
			<a
				href="https://www.linkedin.com/search/results/all/?keywords={person_company_search}"
				target="_blank">LinkedIn</a
			>
		</li>
		<li>
			<a href="https://contacts.google.com/search/{person_search}" target="_blank"
				>Google Contact Directory</a
			>
		</li>
	</ul>
</div>

<style>
	.details {
		display: none;
	}

	.details.state-guess-correct,
	.details.state-guess-gave_up,
	.details.state-guess-impossible_no_images {
		display: block;
	}

	h1 {
		font-size: 1.2em;
		margin: 0;
	}
</style>
