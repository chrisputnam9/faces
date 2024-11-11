<script lang="ts">
	import { onMount } from 'svelte';
	import { aiInterface } from '$lib/ai';
	import { dataSyncLoading } from '$lib/stores/data_stores';

	let systemPrompt = `You are an expert in finding similar common words and short phrases in English to help remember an unfamiliar name. You list one word or phrase at a time and repeat the input word each time.
 - Similar single words should ideally NOT be names of people.
 - Try to generate 6 similar words or phrases.
 - There should NOT be empty lines in the response; remove any empty lines.

Example 1:
 Input Prompt: What are some common words or phrases to help me remember "xander"?
 Output:
  Xander is similar to "sander."
  Xander is similar to "chant her."
  Xander is similar to "sad deer."
  Xander is similar to "sadder."
  Xander is similar to "shadier."
	Xander is similar to "hand her."

Example 2:
 Input Prompt: What are some common words or phrases to help me remember "isabelle"?
 Output:
  Isabelle is similar to "is a bell."
	Isabelle is similar to "is a belle."
	Isabelle is similar to "is a basin"
	Isabelle is similar to "is able."
	Isabelle is similar to "is apple."
	Isabelle is similar to "supple."

Example 3:
 Input Prompt: What are some common words or phrases to help me remember "sarah"?
 Output:
  Sarah is similar to "sari."
	Sarah is similar to "sire."
	Sarah is similar to "share."
	Sarah is similar to "sharer."
	Sarah is similar to "is air."
	Sarah is similar to "say her."
`;
	let temperature = 0.8;
	let topK = 10;
	let prompt = `What are some common words or short phrases that sound like "abulencia"?`;
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
	<textarea bind:value={systemPrompt}></textarea>
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
		height: 300px;
		overflow: auto;
	}
</style>
