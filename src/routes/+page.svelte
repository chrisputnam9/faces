<script lang="ts">
	import { onMount } from 'svelte';

	export let data;

	let html_feedback = 'Feedback';
	let person = null;
	let name_entered_by_user = '';
	let el_input_name;
	let image_index = 0;
	let image = null;

	// Sate of guess input: in_progress, correct, incorrect
	let stateGuess = 'in_progress';

	function showRandomPerson() {
		const randomIndex = Math.floor(Math.random() * data.people.length);
		person = data.people[randomIndex];
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

	showRandomPerson();
	handleInputKeys();

	$: person_search = person.name + ' ' + person.companies.join(' ');

	$: if (!image) {
		stateGuess = 'impossible_no_images';
		html_feedback =
			'Oops, no images available for this person. Maybe you can find one?<br>Otherwise, press enter to continue.';
	}

	onMount(() => {
		el_input_name.focus();
	});
</script>

<div class="background">
	<div class="quiz-container">
		<div class="quiz-content">
			{#if image}
				<div class="img-container">
					<img src={image} on:click={cycleImage} alt="A randomly selected person" />
				</div>
			{/if}
			<input
				type="text"
				placeholder="Type name and press enter"
				on:keyup={handleInputKeys}
				bind:value={name_entered_by_user}
				bind:this={el_input_name}
			/>
			<div class="feedback">{@html html_feedback}</div>
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
		width: 300px;
		height: 300px;
		padding: 25px;
		display: flex;
		justify-content: center;
		align-items: center;
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
