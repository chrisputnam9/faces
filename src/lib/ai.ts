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

	initialized: false,
	init: async function () {
		aiInterface.initialized = true;
	},

	similar_words_map: {},
	similar_words: async function (word: string) {

		word = word.toLowerCase();
		word = word.replace(/[^a-zA-Z0-9]*/g, '');

		if (word in aiInterface.similar_words_map) {
			return aiInterface.similar_words_map[word];
		}

		aiInterface.similar_words_map[word] = await aiInterface.run_prompt(`List 3-5 english words similar to ${word}`);

		return aiInterface.similar_words_map[word];
	},

	run_prompt: async function (prompt_string: string) {
		aiInterface.init();

		// TODO

	}

}
