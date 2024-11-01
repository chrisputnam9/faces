<script lang="ts">
	export let person = null;
	export let state_guess = false;

	let person_company_search = '';
	let person_search = '';
	let similar_words_by_name = {};
	let similar_words = [];

	function update_similar_words(name) {
		console.log('update_similar_words', name);
		// TODO
	}

	// Set person search string for social sites
	$: person_company_search = person ? person.name + ' ' + person.companies.join(' ') : '';
	$: person_search = person ? person.name : '';
	$: update_similar_words(person.name);
</script>

<div class="details state-guess-{state_guess}">
	<h1>
		{person.name}
		<br />
		{#if person.companies.length > 0}<small>({person.companies.join(', ')})</small>{/if}
	</h1>

	<b>Similar Words:</b>
	<ul>
		{#each similar_words as word}
			<li>{word}</li>
		{/each}

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
