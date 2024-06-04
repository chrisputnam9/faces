<script lang="ts">
	let total = 0;

	const tracked = {
		known: [],
		learning: [],
		unknown: [],
		no_images: [],
		total: []
	};

	export function trackGuess(person, state_guess) {
		const id = person.id;

		let key = false;

		if (state_guess === 'impossible_no_images') {
			key = 'no_images';
		} else if (state_guess === 'correct') {
			key = 'known';
		} else if (state_guess === 'partially_correct') {
			key = 'learning';
		} else if (state_guess === 'incorrect') {
			key = 'unknown';
		}

		if (key && !tracked[key].includes(id)) {
			tracked[key].push(id);
		}

		if (!tracked.total.includes(id)) {
			tracked.total.push(id);
		}

		// Trigger reactions
		tracked = tracked;
	}
</script>

<section>
	<h1>This Session</h1>
	<table>
		<tr><th>Known:</th> <td>{tracked.known.length}</td></tr>
		<tr><th>Learning:</th> <td>{tracked.learning.length}</td></tr>
		<tr><th>No Images:</th> <td>{tracked.no_images.length}</td></tr>
		<tr><th>Total:</th> <td>{tracked.total.length}</td></tr>
	</table>
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
	table th {
		text-align: right;
	}
</style>
