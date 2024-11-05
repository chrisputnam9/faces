<script lang="ts">
	import { onMount } from 'svelte';
	import { aiInterface } from '$lib/ai';
	import { dataSyncLoading } from '$lib/stores/data_stores';

	let prompt =
		'What are 50 common english words that are spelled very similarly to "abulencia"? Put inital response and reasoning in <thinking></thinking> tags.';
	//'  In the same tags, narrow down the 10 words that are the *most* similar in terms of spelling or pronunciation to "abulencia". Finally, list those 10 words by themselves with no other text in <output></output> tags.';
	let result = 'Hit enter to send prompt';

	async function sendPrompt() {
		result = 'Running prompt...';
		result = await aiInterface.run_prompt(prompt);
		console.log('Done');
	}

	onMount(async () => {
		dataSyncLoading.set(false);
	});
</script>

<section>
	<textarea bind:value={prompt}></textarea>
	<button on:click={sendPrompt}>Enter</button>
	<pre>{result}</pre>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
	}
	textarea {
		width: 600px;
		height: 200px;
	}
	button {
		width: 200px;
		height: 50px;
		align-self: center;
		justify-self: center;
		margin: 10px;
	}
	pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		display: block;
		background: #ddd;
		border: 1px solid #aaa;
		width: 600px;
		height: 400px;
	}
</style>
