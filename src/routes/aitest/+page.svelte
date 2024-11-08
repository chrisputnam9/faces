<script lang="ts">
	import { onMount } from 'svelte';
	import { aiInterface } from '$lib/ai';
	import { dataSyncLoading } from '$lib/stores/data_stores';

	let systemPrompt = `You are a cheerful assistant who helps come up with ways to remember names`;
	let temperature = 0.5;
	let topK = 40;
	let prompt = `What are some common words or short phrases with many of the same letters as "abulencia" to help me remember it?`;
	let result = `Hit enter to send prompt`;
	let ai_capabilities = '';

	async function sendPrompt() {
		result = 'Running prompt...';
		try {
			result = await aiInterface.run_prompt(prompt, {
				systemPrompt,
				temperature,
				topK
			});
		} catch (e) {
			result = 'ERROR: ' + e.message + '\n\nTry again.';
		}
	}

	onMount(async () => {
		await aiInterface.init();
		ai_capabilities = JSON.stringify(aiInterface.languageCapabilities, null, 2);
		console.log('AI capabilities:', aiInterface.languageCapabilities);
		console.log(ai_capabilities);
		dataSyncLoading.set(false);
	});
</script>

<section>
	<table>
		<tr>
			<td>
				<h1>AI Capabilities</h1>
				{ai_capabilities}
			</td>
			<td>
				<h1>Options</h1>
				<label for="temperature">Temperature:</label>
				<input type="number" bind:value={temperature} step="0.1" min="0" max="1" />
				&nbsp; &nbsp; &nbsp; &nbsp;
				<label for="topK">Top K:</label>
				<input type="number" bind:value={topK} step="1" min="1" />
			</td>
		</tr>
	</table>
	<h1>System Prompt</h1>
	<h1>Prompt</h1>
	<textarea bind:value={prompt}></textarea>
	<button on:click={sendPrompt}>Enter</button>
	<pre>{result}</pre>
</section>

<style>
	h1 {
		font-size: 1em;
	}
	section {
		background: white;
		width: 100%;
		padding: 20px;
		display: flex;
		flex-direction: column;
	}
	textarea {
		width: 400px;
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
		width: 600px;
		height: 400px;
	}
</style>
