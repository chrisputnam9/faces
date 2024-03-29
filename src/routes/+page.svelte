<script lang="ts">
	import { onMount } from 'svelte';

	export let data;

	// TODO switch images to just fade out/in and only show one at a time vs. extra html

	let html_feedback = 'Feedback';
	let person = null;
	let name_entered_by_user = '';
	let el_input_name;

	function showRandomPerson() {
		const randomIndex = Math.floor(Math.random() * data.people.length);
		person = data.people[randomIndex];
	}

	function giveFeedback(feedback = '') {
		html_feedback = feedback;
	}

	function handleInputKeys(event = {}) {
		if (name_entered_by_user === '') {
			return giveFeedback('Type name and press enter');
		}

		if (!('key' in event)) {
			return;
		}

		if (event.key === 'Esc') {
			// TODO implement
			return giveFeedback('Not yet implemented');
		}

		if (event.key !== 'Enter') {
			return;
		}

		if (name_entered_by_user === person.name) {
			return giveFeedback('Exactly!<br>Press enter again to continue.');
		}

		let feedback = 'Incorrect.';
		if (name_entered_by_user.toLowerCase() === person.name.toLowerCase()) {
			feedback = 'Close! But, the case is not quite right.';
		}

		giveFeedback(feedback + '<br>Try again or hit Esc to see name.');
	}

	showRandomPerson();
	handleInputKeys();

	onMount(() => {
		el_input_name.focus();
	});
</script>

<div class="background">
	<div class="quiz-container">
		<div class="quiz-content">
			<div class="img-slider">
				<div class="img-slider-strip">
					{#each person.photos as photo}
						<img src={photo} alt="A randomly selected person" />
					{/each}
				</div>
			</div>
			<input
				type="text"
				placeholder="Type name and press enter"
				on:keyup={handleInputKeys}
				bind:value={name_entered_by_user}
				bind:this={el_input_name}
			/>
			<div class="feedback">{@html html_feedback}</div>
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
		padding: 40px 20px;
		width: 300px;
		border-radius: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.quiz-content {
		justify-content: center;
		align-items: center;
	}

	.img-slider {
		width: 200px;
		overflow: hidden;
	}

	.img-slider-strip {
		width: 9999px;
	}

	.img-slider img {
		width: 200px;
	}

	input {
		margin: 10px 0;
	}
</style>
