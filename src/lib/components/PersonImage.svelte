<script lang="ts">
	export let person = null;
	export let state_guess = false;

	let image = false;
	let image_index = 0;
	let image_button = false;
	let html_image_caption = false;

	export function cycleImage() {
		if (person.images.length < 2) {
			return;
		}
		image_index = (image_index + 1) % person.images.length;
		image = person.images[image_index];
	}

	function updatePerson(person) {
		if (!person) return;

		image_index = 0;
		image = false;
		image_button = false;

		if (person.images.length < 1) {
			state_guess = 'impossible_no_images';
			return;
		}

		if (person.images.length > 0) {
			image = person.images[image_index];
			image_button = true;
			return;
		}
	}

	$: updatePerson(person);

	$: html_image_caption = person?.images?.length
		? `Image ${image_index + 1} of ${person.images.length}`
		: false;
</script>

<div class="img-component">
	{#if image}
		<div class="img-container" title={html_image_caption}>
			<img src={image} alt="A randomly selected person" />
		</div>
		{#if image_button}
			<button on:click={cycleImage}>
				{@html html_image_caption}
				- click or alt-i to cycle &#x27AA;
			</button>
		{:else}
			<p>{@html html_image_caption}</p>
		{/if}
	{/if}
</div>

<style>
	.img-component {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	.img-container {
		border: 3px solid #ddd;
		border-radius: 10px;
		aspect-ratio: 1 / 1;
		width: 350px;
		height: auto;
		max-width: 100%;
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		overflow: hidden;
	}

	.img-container img {
		width: 101%;
		height: 101%;
	}
</style>
