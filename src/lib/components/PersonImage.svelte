<script lang="ts">
	import { data } from '$lib/data';
	import generic_person_img from '$lib/img/generic_person.jpg';

	export let person = null;
	export let state_guess = false;
	export let keys_available = false;
	export let show_buttons = true;

	const title_button_image_cycle = keys_available
		? 'Click or alt-i to cycle images'
		: 'Click to cycle images';

	const title_button_image_add = keys_available
		? 'Click or alt-a to add an image'
		: 'Click to add an image';

	let image = false;
	let image_index = 0;
	let image_button = false;
	let html_image_caption = false;

	export function addImage() {
		const new_image = prompt('Enter URL of new image:');
		if (!new_image) return;

		person.images.unshift(new_image);
		data.savePerson(person);
		updatePerson(person);
	}

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

		// No images - return early
		if (person.images.length < 1) {
			state_guess = 'impossible_no_images';
			return;
		}

		// At least one image
		image = person.images[image_index];
		image_button = person.images.length > 1;
	}

	$: updatePerson(person);

	$: html_image_caption = person?.images?.length
		? `${image_index + 1}/${person.images.length}`
		: 'No images';
</script>

<div class="img-component">
	<div class="img-btn-container" title={html_image_caption}>
		<div class="img-container" title={html_image_caption}>
			<img src={image ? image : generic_person_img} alt="A randomly selected person" />
		</div>
		{#if show_buttons}
			<div class="btn-container" title={html_image_caption}>
				{#if image_button}
					<button title={title_button_image_cycle} on:click={cycleImage}>
						{@html html_image_caption}
						&#x27AA;
					</button>
				{:else}
					<button disabled="disabled">{@html html_image_caption}</button>
				{/if}
				<button title={title_button_image_add} on:click={addImage}>Add &#8853;</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.img-component {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.img-btn-container {
		width: 350px;
		max-width: 100%;
	}

	.img-container {
		border-bottom: 0;
		border-radius: 10px 10px 0 0;
		aspect-ratio: 1 / 1;
		width: 100%;
		height: auto;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}

	.img-container img {
		width: 101%;
		height: 101%;
	}

	.img-container,
	.btn-container {
		border: 2px solid #ddd;
	}

	.btn-container {
		width: 100%;
		border-radius: 0 0 10px 10px;
		display: flex;
		flex-direction: row;
	}

	button {
		display: block;
		width: auto;
		height: 20px;
		cursor: pointer;
		border: 0;
		border-radius: 0;
		flex-basis: 50%;
	}

	button:hover {
		background-color: #ddd;
	}

	button:disabled {
		cursor: not-allowed;
	}
</style>
