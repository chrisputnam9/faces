<script lang="ts">
	import { onMount } from 'svelte';
	import { dataInterface } from '$lib/data';
	import { PersonDetails, PersonImage, QuizSessionMetrics } from '$lib/components';
	import { PeopleStore } from '$lib/stores';

	let personImage;
	let quizSessionmetrics;

	let html_feedback = 'Feedback';
	let person_index = -1;
	let person = false;
	let name_entered_by_user = '';
	let el_input_name;

	// State of guess input
	// Must be one of the values defined in dataInterface.state_guess_weights
	let state_guess = 'loading';

	function showNextPerson() {
		const people = $PeopleStore.filtered;
		if (people.length < 1) {
			throw new Error('No people data available.');
			return;
		}
		person_index++;
		person = people[person_index];
	}

	function giveFeedback(feedback = '') {
		html_feedback = feedback;
	}

	function handleInputKeys(event = {}) {
		// Maybe cycle image
		if (event.key === 'i' && event.altKey) {
			personImage.cycleImage();
			return;
		}

		// Maybe add image
		if (event.key === 'a' && event.altKey) {
			personImage.addImage();
			return;
		}

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
		if (state_guess === 'incorrect' || state_guess === 'partially_correct') {
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
			state_guess = 'partially_correct';
			feedback = 'Close! But, the case is not quite right.';
		} else if (person.name.toLowerCase().includes(name_entered_by_user.toLowerCase())) {
			state_guess = 'partially_correct';
			feedback = "That's part of it!";
		}

		giveFeedback(feedback + '<br>Try again or press Enter again to give up.');
	}

	async function trackGuess(state_guess) {
		if (!(state_guess in dataInterface.state_guess_weights)) {
			throw new Error(
				'Invalid state_guess value: ' + state_guess,
				'not defined in dataInterface.state_guess_weights'
			);
		}

		quizSessionmetrics?.trackGuess(person, state_guess);

		if (state_guess === 'loading') {
			return;
		}

		if (state_guess == 'impossible_no_images') {
			html_feedback =
				'Oops, no images available for this person. Maybe you can find one?<br>LinkedIn, Facebook, and other search links below might help.<br>Otherwise, press enter to continue.';
		}

		dataInterface.trackGuess({
			person,
			state_guess
		});
	}

	// Update tracking data if state changes
	$: trackGuess(state_guess);

	onMount(async () => {
		await PeopleStore.load();
		showNextPerson();
		handleInputKeys();
		el_input_name.focus();
	});
</script>

<section>
	<div class="quiz-container">
		<div class="quiz-content">
			<PersonImage bind:person keys_available="1" bind:state_guess bind:this={personImage} />
			<input
				type="text"
				placeholder="Type name and press enter"
				on:keyup={handleInputKeys}
				bind:value={name_entered_by_user}
				bind:this={el_input_name}
			/>
			{#if person}
				<div class="feedback">{@html html_feedback}</div>
				<PersonDetails {person} {state_guess} />
			{:else}
				<p>Loading...</p>
			{/if}
		</div>
	</div>

	<QuizSessionMetrics bind:this={quizSessionmetrics} />
</section>

<style>
	section {
		width: 100%;
		display: flex;
		justify-content: start;
		align-items: center;
		padding: 0;
		align-items: start;
		gap: 20px;
	}
	.quiz-container {
		background-color: #eee;
		padding: 10px;
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

	input {
		margin: 10px 0;
	}
</style>
