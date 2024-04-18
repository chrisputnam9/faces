/**
 * Data Interface
 */

export const data = {
	loadPeople: async function () {
		// Load from /data route for now
		// TODO: Will read from Google Drive sync in the future
		const response = await fetch('/people');
		const people = await response.json();
		return people;
	},
	loadTracking: async function () {
		// Load from /data route for now
		// TODO: Will read from Google Drive sync
		// TODO TODO swap to fetch approach
		const tracking = await fs.promises.readFile('data/tracking.json', 'utf8');
		return JSON.parse(tracking);
	},
	saveTracking: async function (tracking) {
		// https://nodejs.org/en/learn/manipulating-files/writing-files-with-nodejs
	}

}
