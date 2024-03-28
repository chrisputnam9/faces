<script>
	export let data;

	let person = null;

	function showRandomPerson() {
		const randomIndex = Math.floor(Math.random() * data.people.length);
		person = data.people[randomIndex];
	}

	showRandomPerson();

	// TODO switch images to just fade out/in and only show one at a time vs. extra html
</script>

<div class="background">
	<div class="quiz-container">
		<div class="img-slider">
			<div class="img-slider-strip">
				{#each person.photos as photo}
					<img src={photo} alt={person.name} />
				{/each}
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
		padding: 20px;
		border-radius: 10px;
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
</style>
