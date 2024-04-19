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
	trackGuess: async function () {
		// Post to /data route for now
		// TODO: Will read from Google Drive sync
		// TODO TODO swap to fetch approach
		const tracking = await fs.promises.readFile('data/tracking.json', 'utf8');
		return JSON.parse(tracking);
	},
	loadTracking: async function (tracking) {
	}

}
