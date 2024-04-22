<script lang="ts">
	import { onMount } from 'svelte';
	import { data } from '$lib/data';

	let htmlFeedback = 'Feedback';
	let people = [];
	let person = false;
	let person_search = '';
	let name_entered_by_user = '';
	let elInputName;
	let image_index = 0;
	let image = null;
	let imageButton = false;
	let htmlImageCaption = false;

	// Sate of guess input
	let stateGuess = 'loading';

	function showRandomPerson() {
		if (!people) {
			throw new Error('No people data available.');
			return;
		}
		const randomIndex = Math.floor(Math.random() * people.length);
		person = people[randomIndex];
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
		htmlFeedback = feedback;
	}

	function handleInputKeys(event = {}) {
		let feedback = 'Type name and press enter.';

		if (!('key' in event) || event.key !== 'Enter') {
			stateGuess = 'in_progress';
			return giveFeedback(feedback);
		}

		/* Enter after a correct guess */
		if (
			stateGuess === 'correct' ||
			stateGuess === 'gave_up' ||
			stateGuess === 'impossible_no_images'
		) {
			stateGuess = 'in_progress';
			showRandomPerson();
			name_entered_by_user = '';
			return giveFeedback(feedback);
		}

		/* Enter after an incorrect guess */
		if (stateGuess === 'incorrect') {
			stateGuess = 'gave_up';
			name_entered_by_user = person.name;
			return giveFeedback('Press Enter again to continue.');
		}

		if (name_entered_by_user === person.name) {
			stateGuess = 'correct';
			return giveFeedback('Exactly!<br>Press Enter again to continue.');
		}

		stateGuess = 'incorrect';
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

	async function trackGuess(stateGuess) {
		console.log('trackGuess frontend', stateGuess);

		if (stateGuess === 'loading') {
			return;
		}

		data.trackGuess({
			person,
			stateGuess
		});
	}

	// Set person search string for social sites
	$: person_search = person ? person.name + ' ' + person.companies.join(' ') : '';

	// Update feedback and state if there are no images
	$: if (person && !image) {
		stateGuess = 'impossible_no_images';
		htmlFeedback =
			'Oops, no images available for this person. Maybe you can find one?<br>Otherwise, press enter to continue.';
	}

	// Update tracking data if state changes
	$: trackGuess(stateGuess);

	$: if (person) {
		imageButton = false;
		if (person.images.length > 0) {
			htmlImageCaption = 'Image 1 of 1';
		}
		if (person.images.length > 1) {
			htmlImageCaption = `Image ${image_index + 1} of ${person.images.length}`;
			imageButton = true;
		}
	}

	onMount(async () => {
		people = await data.loadPeopleOrdered();
		showRandomPerson();
		handleInputKeys();
		elInputName.focus();
	});
</script>

<div class="background">
	<div class="quiz-container">
		<div class="quiz-content">
			{#if image}
				<div class="img-container" title={htmlImageCaption}>
					<img src={image} alt="A randomly selected person" />
				</div>
				{#if imageButton}
					<button on:click={cycleImage}>{@html htmlImageCaption} - click to cycle &#x27AA;</button>
				{:else}
					<p>{@html htmlImageCaption}</p>
				{/if}
			{/if}
			<input
				type="text"
				placeholder="Type name and press enter"
				on:keyup={handleInputKeys}
				bind:value={name_entered_by_user}
				bind:this={elInputName}
			/>
			{#if person}
				<div class="feedback">{@html htmlFeedback}</div>
				<div class="details state-guess-{stateGuess}">
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
