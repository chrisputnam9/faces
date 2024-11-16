/**
 *	AI Interface
 * *****************************

		Requirements:
			- Latest version of Chrome
			- At least 22GB storage space free
			- Integrated or discrege GPU
			- 4GB VRAM
			- Non-metered network connection

		Setup:
			- Open a new tab in Chrome, go to chrome://flags/#optimization-guide-on-device-model
			- Select Enabled BypassPerfRequirement
			- This bypass performance checks which might get in the way of having Gemini Nano downloaded on your device.
			- Go to chrome://flags/#prompt-api-for-gemini-nano
			- Select Enabled
			- Relaunch Chrome.
			- Open DevTools and send (await ai.languageModel.capabilities()).available; in the console. 
			- If this returns “readily”, then you are all set. 

		If this fails, continue as follows:
			- 📣🆕Force Chrome to recognize that you want to use this API. To do so, open DevTools and send  await ai.languageModel.create(); in the console. This will likely fail but it’s intended.
			- Relaunch Chrome. 
			- Open a new tab in Chrome, go to chrome://components 
			- Confirm that Gemini Nano is either available or is being downloaded
			- You'll want to see the Optimization Guide On Device Model present with a version greater or equal to 2024.5.21.1031.
			- If there is no version listed, click on Check for update to force the download.
			- Once the model has downloaded and has reached a version greater than shown above, open DevTools and send (await ai.languageModel.capabilities()).available; in the console. If this returns “readily”, then you are all set. 
			- Otherwise, relaunch, wait for a little while, and try again from step 1. 

	*/

export const aiInterface = {

	languageModel: null,
	languageCapabilities: null,

	initialized: false,
	init: async function () {
		if (!('ai' in window)) {
			throw new Error('AI Interface not available - setup needed');
		}

		if ('languageModel' in window.ai) {
			aiInterface.languageModel = window.ai.languageModel;
		}
		if ('assistant' in window.ai) {
			aiInterface.languageModel = window.ai.assistant;
		}

		if (!aiInterface.languageModel) {
			throw new Error('AI Language Model not available - setup needed');
		}

		let capabilities = await aiInterface.languageModel.capabilities();

		if (capabilities.available !== 'readily') {
			await aiInterface.languageModel.create();
			capabilities = await aiInterface.languageModel.capabilities();
		}

		if (capabilities.available !== 'readily') {
			throw new Error('AI Language Model not available - setup needed');
		}

		aiInterface.initialized = true;
		aiInterface.languageCapabilities = capabilities;
		return true;
	},

	similar_words_map: {},
	get_similar_words: async function (word: string, fresh=false) {

		if (word in aiInterface.similar_words_map && !fresh) {
			return aiInterface.similar_words_map[word];
		}

		try {
			aiInterface.similar_words_map[word] = await aiInterface.run_prompt(
				`Would you please list some common English words or short phrases that sound like "${word}"?`,
				{
					systemPrompt: `You are an expert in finding similar-sounding common words and short phrases in English. Given a request, you list one similar word or phrase at a time and repeat the input word each time.
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
	`,
					temperature: 0.8,
					topK: 10,
				}
			);
		} catch (e) {
			throw new Error(`Failed with ${word} - ` + e.message);
		}

		return aiInterface.similar_words_map[word];
	},

	run_prompt: async function (prompt_string: string, options = {}) {
		await aiInterface.init();
		const session = await aiInterface.languageModel.create(options);
		let result = false;
		let tries = 0;
		while (!result && tries < 5) {
			try {
				console.log(`Running prompt "${prompt_string}" with options:`, options);
				result = await session.prompt(prompt_string);
			} catch (e) {
				tries++;
				console.warn(`Prompt attempt #${tries} failed:`, e);
				result = false;
			}
		}
		if (!result) {
			throw new Error(`Prompt failed through ${tries} tries.`);
		}
		session.destroy();
		return result;
	}

}
