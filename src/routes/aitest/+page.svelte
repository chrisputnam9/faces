<script lang="ts">
	import { onMount } from 'svelte';
	import { aiInterface } from '$lib/ai';
	import { dataSyncLoading } from '$lib/stores/data_stores';

	let systemPrompt = `You are an expert in finding similar-sounding common words and short phrases in English. Given a request, you list one similar word or phrase at a time and repeat the input word each time.
 - All responses must be in English.
 - Responses should NOT be names of people
 - Responses should NOT be insulting
 - Try to generate 6 similar words or phrases.
 - There should NOT be empty lines in the response; remove any empty lines.

Example 1:
 Input Prompt: Would you please list some common words or phrases that sound like "xander"?
 Output:
  Xander is similar to "sander"
  Xander is similar to "chant her"
  Xander is similar to "sad deer"
  Xander is similar to "sadder"
  Xander is similar to "shadier"
	Xander is similar to "hand her"

Example 2:
 Input Prompt: Would you please list some common words or phrases that sound like "jonathon"?
 Output:
  Jonathon is similar to "yawn a ton"
	Jonathon is similar to "marathon"
	Jonathon is similar to "gin or thin"
	Jonathon is similar to "young and thin"
	Jonathon is similar to "vacation"
	Jonathon is similar to "yon station"

Example 3:
  Input Prompt: Would you please list some common words or phrases that sound like "brubacher"?
	Output:
		Brubacher is similar to "brew baker"
		Brubacher is similar to "rub a chair"
		Brubacher is similar to "rob a car"
		Brubacher is similar to "roob acre"
		Brubacher is similar to "bribe a cur"
		Brubacher is similar to "bro biker"

Example 4:
  Input Prompt: Would you please list some common words or phrases that sound like "jan"?
	Output:
	  Jan is similar to "jam"
		Jan is similar to "yawn"
		Jan is similar to "yarn"
		Jan is similar to "chain"
		Jan is similar to "chant"
		Jan is similar to "can"
`;
	let temperature = 0.8;
	let topK = 3;
	let prompt = `Would you please list some common words or short phrases that sound like "sarah"?`;
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
			console.error(e);
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
		temperature = langCap.defaultTemperature;
		topK = langCap.defaultTopK;
		dataSyncLoading.set(false);
	});
</script>

<section>
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
