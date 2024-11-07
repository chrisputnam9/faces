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

		console.log({capabilities});

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
	get_similar_words: async function (word: string) {

		word = word.toLowerCase();
		word = word.replace(/[^a-zA-Z0-9]*/g, '');

		if (word in aiInterface.similar_words_map) {
			return aiInterface.similar_words_map[word];
		}

		const response = await aiInterface.run_prompt(word);

		aiInterface.similar_words_map[word] = response;
		console.log(aiInterface.similar_words_map);

		return aiInterface.similar_words_map[word];
	},

	run_prompt: async function (prompt_string: string) {
		await aiInterface.init();

		console.log('Running prompt: ' + prompt_string);
		const session = await aiInterface.languageModel.create({
			systemPrompt: `You are an expert in finding similar common words and short phrases in English to help remember an unfamiliar name. You list one word or phrase at a time and repeat the input word each time.

			Example:
				Input Prompt: What are some common words or phrases to help me remember "xander"?
				Output:
				  Xander is similar to "sander."
				  Xander is similar to "chant her."
				  Xander is similar to "sad deer."
				  Xander is similar to "sadder."
				  Xander is similar to "shadier."
				  Xander is similar to "hand her."`,
			/*
			systemPrompt: `Given input of asingle word, output 3 common similar sounding English words or phrases, list the 3 common English words or phrases that rhyme and have a similar sound to the input word. 

			Rules:
				- The output must be in English.
				- The output must be 3 words or phrases.
				- Each word or phrase in the output must be common and easily understood.
				- Each word or phrase in the output must rhyme or have a similar sound to the input word.
				- The output must be separated by commas.
				- The output must be in a single line.
				- The output must be in a comma-separated list.

			Example 1:
				Input: cat
			   Output: chat, sat, hat

			Example 2:
				Input: Xander
			   Output: sander, chant her, sad deer
			`,
			*/
			temperature: .9,
			//topK: aiInterface.languageCapabilities.defaultTopK
			topK: .2 * aiInterface.languageCapabilities.maxTopK
		});
		const result = await session.prompt(prompt_string);
		session.destroy();

		console.log(result);
		return result;
	}

}
