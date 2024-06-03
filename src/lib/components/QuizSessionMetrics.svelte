<script lang="ts">
	let tracked = {
		known: [],
		learning: [],
		no_images: []
	};

	export function trackGuess(person, state_guess) {
		const id = person.id;

		let key = 'learning';
		if (state_guess == 'impossible_no_images') {
			key = 'no_images';
		} else if (state_guess == 'correct') {
			key = 'known';
		}

		if (tracked[key].includes(id)) {
			return;
		}

		tracked[key].push(id);
	}

	$: total = tracked.known.length + tracked.learning.length + tracked.no_images.length;
</script>

<section>
	<h1>Quiz Session Metrics</h1>
	<ul>
		<li><b>Known:</b> {tracked.known.length}</li>
		<li><b>Learning:</b> {tracked.learning.length}</li>
		<li><b>No Images:</b> {tracked.no_images.length}</li>
		<li><b>Total:</b> {total}</li>
	</ul>
</section>

<style>
	section {
		background-color: #eee;
		padding: 10px;
		border-radius: 10px;
		display: flex;
		justify-content: center;
		align-items: start;
		flex-direction: column;
	}
</style>
