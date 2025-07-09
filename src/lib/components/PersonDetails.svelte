<script lang="ts">
	export let person = null;
	export let state_guess = false;

	let person_company_search = '';
	let person_search = '';

	let modelId = 'claude-4-sonnet-20250514';

	async function get_ai_help() {
		let images = '';
		for (const image of person.images) {
			images += '\n - ' + image;
		}

		let prompt = `
Refer to "AI Instructions for helping memorize names" on this page.

Then, please help me memorize this person's name.

**Name:** ${person.name}

**Images:** ${images}
		`;

		window.postMessage(
			{
				extension: 'teamai',
				type: 'SET_CONFIG',
				payload: {
					modelId,
					prompt
				}
			},
			'*'
		);
	}

	// Set person search string for social sites
	$: person_company_search = person ? person.name + ' ' + person.companies.join(' ') : '';
	$: person_search = person ? person.name : '';
</script>

<div class="details state-guess-{state_guess}">
	<h1>
		{person.name}
		{#if person.companies.length > 0}<br /><small>({person.companies.join(', ')})</small>{/if}
	</h1>

	{#each person.facts as fact}
		<br /><b>{fact.name}:</b> {fact.value}
	{/each}
	{#each person.emails as email}
		<br /><b>Email:</b> <a href="mailto:{email}" target="_blank">{email}</a>
	{/each}

	{#if person.description}
		<!-- Trusted user input only used by the user -->
		<!-- eslint-disable svelte/no-at-html-tags -->
		<br />{@html person.description.replace(/\n/g, '<br />')}
	{/if}

	{#each person.links as link}
		<br /><a href={link.url} target="_blank">{link.text}</a>
	{/each}
	<br /><a href="https://www.google.com/search?q=name meaning {person.first_name}" target="_blank">
		Meaning of name "{person.first_name}"
	</a>
	<br /><a href="https://www.google.com/search?q=name meaning {person.last_name}" target="_blank">
		Meaning of name "{person.last_name}"
	</a>
	<br /><a href="https://www.facebook.com/search/top/?q={person_company_search}" target="_blank">
		Facebook
	</a>
	<br /><a
		href="https://www.linkedin.com/search/results/all/?keywords={person_company_search}"
		target="_blank"
	>
		LinkedIn
	</a>
	<br /><a href="https://contacts.google.com/search/{person_search}" target="_blank">
		Google Contact Directory
	</a>

	<br />
	<br />
	<h2>AI Help:</h2>
	<br />
	<button on:click={() => get_ai_help()}> Help me remember this person's name</button>
	<select bind:value={modelId}>
		<option value="claude-4-sonnet-20250514">Claude 4 Sonnet</option>
		<option value="fast-model">Fast AI</option>
		<option value="smart-model">Smart AI</option>
		<option value="reasoning-model">Reasoning AI</option>
	</select>
	<br /><small style="font-weight: bold;text-align:right;"><p>Warning: experimental</p></small>
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

	h1,
	h2 {
		font-size: 1.2em;
		margin: 0;
		padding: 0;
		display: inline;
	}
	button {
		margin-top: 10px;
	}
	.error {
		color: darkred;
		text-decoration: underline;
	}
</style>
