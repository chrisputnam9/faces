<script lang="ts">
	import { onMount } from 'svelte';
	import { aiInterface } from '$lib/ai';
	import { dataSyncLoading } from '$lib/stores/data_stores';

	let systemPrompt = aiInterface.SIMILAR_WORD_SYSTEM_PROMPT;
	let prompt = aiInterface.SIMILAR_WORD_PROMPT.replace('%word%', 'Emily');
	let temperature = 0.8;
	let topK = 3;
	let result = `Hit enter to send prompt`;
	let ai_capabilities = '';

	let ai_init_error = false;

	async function sendPrompt() {
		result = 'Running prompt...';
		try {
			result = await aiInterface.run_prompt(prompt, {
				systemPrompt,
				temperature,
				topK
			});
		} catch (e) {
			console.error(e);
			result = 'ERROR: ' + e.message + '\n\nTry again.';
		}
	}

	onMount(async () => {
		try {
			await aiInterface.init();
			let langCap = aiInterface.languageCapabilities;
			ai_capabilities = JSON.stringify(
				{
					available: langCap.available,
					defaultTopK: langCap.defaultTopK,
					maxTopK: langCap.maxTopK,
					defaultTemperature: langCap.defaultTemperature
				},
				null,
				2
			);
			temperature = langCap.defaultTemperature;
			topK = langCap.defaultTopK;
		} catch (e) {
			ai_init_error = e.message;
		}
		dataSyncLoading.set(false);
	});
</script>

<section>
	<h1>AI Interface</h1>
	{#if ai_init_error}
		<p>
			{ai_init_error}
			<br /><a href="https://developer.chrome.com/docs/ai/built-in" target="_blank"
				>Click here to learn more about Gemini Nano in Chrome and join the preview to learn how to
				enable the built-in prompt API</a
			>
		</p>
	{:else}
		<table>
			<tr>
				<td>
					<h1>AI Capabilities</h1>
					<pre>{ai_capabilities}</pre>
				</td>
				<td>
					<h1>Options</h1>
					<label for="temperature">Temperature:</label>
					<input type="number" bind:value={temperature} step="0.00000000001" min="0" max="1" />
					<br />
					<label for="topK">Top K:</label>
					<input type="number" bind:value={topK} step="1" min="1" />
				</td>
			</tr>
		</table>
		<h1>System Prompt</h1>
		<textarea bind:value={systemPrompt}></textarea>
		<h1>Prompt</h1>
		<textarea bind:value={prompt}></textarea>
		<button on:click={sendPrompt}>Enter</button>
		<pre>{result}</pre>
	{/if}
</section>

<style>
	h1 {
		font-size: 1em;
	}
	section {
		background: white;
		max-width: 700px;
		width: 100%;
		padding: 20px;
		display: flex;
		flex-direction: column;
	}
	textarea {
		width: 100%;
		height: 100px;
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
		width: 100%;
		height: auto;
	}
	td {
		padding: 5px;
	}
</style>
