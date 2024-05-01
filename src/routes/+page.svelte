<script lang="ts">
	import { onMount } from 'svelte';
	import { data } from '$lib/data';

	let html_feedback = 'Feedback';
	let people = [];
	let person_index = -1;
	let person = false;
	let person_search = '';
	let name_entered_by_user = '';
	let el_input_name;
	let image_index = 0;
	let image = null;
	let image_button = false;
	let html_image_caption = false;

	// Sate of guess input
	let state_guess = 'loading';

	function showNextPerson() {
		if (!people) {
			throw new Error('No people data available.');
			return;
		}
		person_index++;
		person = people[person_index];
		image_index = 0;
		image = false;
		if (person.images.length > 0) {
			image = person.images[image_index];
		}
	}

	function cycleImage() {
		if (person.images.length < 2) {
			return;
		}
		image_index = (image_index + 1) % person.images.length;
		image = person.images[image_index];
	}

	function giveFeedback(feedback = '') {
		html_feedback = feedback;
	}

	function handleInputKeys(event = {}) {
		let feedback = 'Type name and press enter.';

		if (!('key' in event) || event.key !== 'Enter') {
			state_guess = 'in_progress';
			return giveFeedback(feedback);
		}

		/* Enter after a correct guess */
		if (
			state_guess === 'correct' ||
			state_guess === 'gave_up' ||
			state_guess === 'impossible_no_images'
		) {
			state_guess = 'in_progress';
			showNextPerson();
			name_entered_by_user = '';
			return giveFeedback(feedback);
		}

		/* Enter after an incorrect guess */
		if (state_guess === 'incorrect') {
			state_guess = 'gave_up';
			name_entered_by_user = person.name;
			return giveFeedback('Press Enter again to continue.');
		}

		if (name_entered_by_user === person.name) {
			state_guess = 'correct';
			return giveFeedback('Exactly!<br>Press Enter again to continue.');
		}

		state_guess = 'incorrect';
		feedback = 'Incorrect.';

		if (name_entered_by_user.trim() === '') {
			feedback = 'You have to actually enter something, silly!';
		} else if (name_entered_by_user.toLowerCase() === person.name.toLowerCase()) {
			feedback = 'Close! But, the case is not quite right.';
		} else if (person.name.toLowerCase().includes(name_entered_by_user.toLowerCase())) {
			feedback = "That's part of it!";
		}

		giveFeedback(feedback + '<br>Try again or press Enter again to give up.');
	}

	async function trackGuess(state_guess) {
		if (state_guess === 'loading') {
			return;
		}

		data.trackGuess({
			person,
			state_guess
		});
	}

	// Set person search string for social sites
	$: person_search = person ? person.name + ' ' + person.companies.join(' ') : '';

	// Update feedback and state if there are no images
	$: if (person && !image) {
		state_guess = 'impossible_no_images';
		html_feedback =
			'Oops, no images available for this person. Maybe you can find one?<br>Otherwise, press enter to continue.';
	}

	// Update tracking data if state changes
	$: trackGuess(state_guess);

	$: if (person) {
		image_button = false;
		if (person.images.length > 0) {
			html_image_caption = 'Image 1 of 1';
		}
		if (person.images.length > 1) {
			html_image_caption = `Image ${image_index + 1} of ${person.images.length}`;
			image_button = true;
		}
	}

	onMount(async () => {
		people = await data.loadPeopleOrdered();
		showNextPerson();
		handleInputKeys();
		el_input_name.focus();
	});
</script>

<div class="background">
	<div class="quiz-container">
		<div class="quiz-content">
			{#if image}
				<div class="img-container" title={html_image_caption}>
					<img src={image} alt="A randomly selected person" />
				</div>
				{#if image_button}
					<button on:click={cycleImage}>{@html html_image_caption} - click to cycle &#x27AA;</button
					>
				{:else}
					<p>{@html html_image_caption}</p>
				{/if}
			{/if}
			<input
				type="text"
				placeholder="Type name and press enter"
				on:keyup={handleInputKeys}
				bind:value={name_entered_by_user}
				bind:this={el_input_name}
			/>
			{#if person}
				<div class="feedback">{@html html_feedback}</div>
				<div class="details state-guess-{state_guess}">
					<h1>{person.name}</h1>
					<b>{person.companies.join(', ')}</b><br /><br />
					<b>Links:</b>
					<ul>
						{#each person.links as link}
							<li>
								<a href={link.url} target="_blank">{link.text}</a>
							</li>
						{/each}
						<li>
							<a
								href="https://www.linkedin.com/search/results/all/?keywords={person_search}"
								target="_blank">Search on LinkedIn</a
							>
						</li>
						<li>
							<a href="https://www.facebook.com/search/top/?q={person_search}" target="_blank"
								>Search on Facebook</a
							>
						</li>
					</ul>
				</div>
			{:else}
				<p>Loading...</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.background {
		background-color: #111;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.quiz-container {
		background-color: #eee;
		min-height: 400px;
		min-width: 400px;
		padding: 40px 20px;
		border-radius: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.quiz-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.img-container {
		border: 3px solid #ddd;
		border-radius: 10px;
		width: 300px;
		height: 300px;
		padding: 25px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		cursor: pointer;
	}

	.img-container img {
		max-width: 300px;
		max-height: 300px;
	}

	input {
		margin: 10px 0;
	}

	.details {
		display: none;
	}

	.details.state-guess-correct,
	.details.state-guess-gave_up,
	.details.state-guess-impossible_no_images {
		display: block;
	}
</style>
