<script lang="ts">
	export let person = null;
	export let image = null;

	let image_index = 0;
	let image_button = false;
	let html_image_caption = false;

	function cycleImage() {
		if (person.images.length < 2) {
			return;
		}
		image_index = (image_index + 1) % person.images.length;
		image = person.images[image_index];
	}

	$: if (person) {
		image_index = 0;
		image = false;
		image_button = false;
		if (person.images.length > 0) {
			image = person.images[image_index];
			html_image_caption = 'Image 1 of 1';
		}
		if (person.images.length > 1) {
			html_image_caption = `Image ${image_index + 1} of ${person.images.length}`;
			image_button = true;
		}
	}
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
