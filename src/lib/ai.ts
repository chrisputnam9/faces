/**
 * AI Interface
 */

export const aiInterface = {

	initialized: false,

	init: async function () {
		aiInterface.initialized = true;
	},

	similar_words: async function (word: string) {
		aiInterface.init();

		return word;
	}

}
