<script lang="ts">
	import { aiInterface } from '$lib/ai';
	export let person = null;
	export let state_guess = false;

	let person_company_search = '';
	let person_search = '';
	let similar_words = [];

	async function update_similar_words() {
		console.log('update_similar_words', person.name);
		const words = person.name.split(' ');
		similar_words = [];
		for (const word of words) {
			const new_words = await aiInterface.get_similar_words(word);
			console.log(new_words);
			similar_words.push(new_words);
			console.log(similar_words);
		}
		similar_words = similar_words;
	}

	// Set person search string for social sites
	$: person_company_search = person ? person.name + ' ' + person.companies.join(' ') : '';
	$: person_search = person ? person.name : '';
</script>

<div class="details state-guess-{state_guess}">
	<h1>
		{person.name}
		<br />
		{#if person.companies.length > 0}<small>({person.companies.join(', ')})</small>{/if}
	</h1>

	<h2>Similar Words:</h2>
	{#if similar_words.length === 0}
		<button on:click={update_similar_words}>Find Similar Words</button>
	{:else}
		<ul>
			{#each similar_words as line}
				<li>{line}</li>
			{/each}
		</ul>
	{/if}

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
