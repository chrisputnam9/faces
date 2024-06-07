<script lang="ts">
	export let person = null;
	export let state_guess = false;

	let person_company_search = '';
	let person_search = '';

	// Set person search string for social sites
	$: person_company_search = person ? person.name + ' ' + person.companies.join(' ') : '';
	$: person_search = person ? person.name : '';
</script>

<div class="details state-guess-{state_guess}">
	<h1>{person.name}<br /><small>({person.companies.join(', ')})</small></h1>

	<p>
		{#each person.facts as fact}
			<br /><b>{fact.name}:</b> {fact.value}
		{/each}
	</p>

	<p>{@html person.description.replace(/\n/g, '<br />')}</p>

	<b>Links:</b>
	<ul>
		{#each person.links as link}
			<li>
				<a href={link.url} target="_blank">{link.text}</a>
			</li>
		{/each}
		<li>
			<a
				href="https://www.linkedin.com/search/results/all/?keywords={person_company_search}"
				target="_blank">LinkedIn</a
			>
		</li>
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
			<a
				href="https://webpagefx.mangoapps.com/ce/pulse/user/content/search?search_page=beta_search_home_page&keyword={person_search}&isSearchFullNetwork=true"
				target="_blank">Mango</a
			>
		</li>
		<li>
			<a href="https://www.facebook.com/search/top/?q={person_company_search}" target="_blank"
				>Facebook</a
			>
		</li>
		<li>
			<a href="https://contacts.google.com/search/{person_search}" target="_blank">Directory</a>
		</li>
		<!--
				<li>
					<a
						href="https://mail.google.com/mail/u/0/#search/in%3Aanywhere {person_search}"
						target="_blank">Gmail</a
					>
				</li>
				<li>
					<a
						href="https://drive.google.com/drive/search?q=type:folder%20{person_search}"
						target="_blank">Google Drive</a
					>
				</li>
				-->
		<li>
			<a href="https://artofmemory.com/wiki/Memorizing_Names_and_Faces/" target="_blank"
				>Techniques: Memorizing Names & Faces</a
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
		padding: 0;
	}
</style>
