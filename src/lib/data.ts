/**
 * Data Interface
 */

import fs from 'fs';

export const data = {
	loadPeople: async function () {
		// Load from file for now
		// TODO: Will read from Google Drive sync
		const people = await fs.promises.readFile('data/people.json', 'utf8');
		return JSON.parse(people);
	},
	loadTracking: async function () {
		// Load from file for now
		// TODO: Will read from Google Drive sync
		const tracking = await fs.promises.readFile('data/tracking.json', 'utf8');
		return JSON.parse(tracking);
	},
	saveTracking: async function (tracking) {
		// https://nodejs.org/en/learn/manipulating-files/writing-files-with-nodejs
	}

}
