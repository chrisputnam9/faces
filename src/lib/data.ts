/**
 * Data Interface
 */

export const data = {
	loadPeopleOrdered: async function () {
		const people = await this.loadPeople();

		const tracking = await this.loadTracking();
		// TODO TODO - use tracking data to sort people

		return people;
	},
	trackGuess: async function (new_tracking) {
		const tracking = await this.loadTracking();

		console.log({tracking, new_tracking});

		await this.saveTracking(tracking);

	},

	// Load from API route for now
	// TODO: Will read from Google Drive sync in the future
	loadPeople: async function () {
		const response = await fetch('/people');
		const people = await response.json();
		return people;
	},

	// Load from API route for now
	// TODO: Will read from Google Drive sync in the future
	loadTracking: async function () {
		const response = await fetch('/tracking');
		const tracking = await response.json();
		return tracking;
	},

	// Post to API route for now
	// TODO: Will write to Google Drive sync in the future
	saveTracking: async function (tracking) {
		const rawResponse = await fetch('/tracking', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(tracking)
		});
		const response = await rawResponse.json();

		if (!response.success) {
			console.error('Problem tracking guess state.', response.error);
		}
	}

}
