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

	SIMILAR_WORD_PROMPT: `Provide 6 common English words or short phrases that sound similar to '%word%'. Ensure responses are clear, concise, and free of offensive or suggestive content.`,

	SIMILAR_WORD_SYSTEM_PROMPT: `You are a helpful and informative AI assistant. Given a word, provide 6 similar-sounding English words or short phrases. 

		**Example:**
			*Input:* 'knight'
		*Output:* night, kite, knell, knead, knit, knight 

		Remember to keep your responses: 
				* **Relevant:** Stick to the core task of finding similar-sounding words.
				*		* **Clear:** Use simple and direct language.
				*				* **Concise:** Avoid unnecessary details.
				*					* **Respectful:** Refrain from generating offensive or suggestive content.`,

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
				aiInterface.SIMILAR_WORD_PROMPT.replace('%word%', word),
				{
					systemPrompt: SIMILAR_WORD_SYSTEM_PROMPT,
					temperature: fresh ? 0.9 : 0.8,
					topK: fresh ? 30 : 3,
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
