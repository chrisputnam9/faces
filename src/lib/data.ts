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
	trackGuess: async function ({person, state_guess}) {
		const data = await this.loadTracking();
		const id = person.id;

		if ( ! (id in data.tracking) ) {
			data.tracking[id] = {
				'guesses': {},
			};
		}

		if ( ! (state_guess in data.tracking[id].guesses) ) {
			data.tracking[id].guesses[state_guess] = [];
		}

		data.tracking[id].guesses[state_guess].push(new Date().toISOString());

		console.log(data);

		await this.saveTracking(data);
	},

	// Load from API route for now
	// TODO: Will read from Google Drive sync in the future
	loadPeople: async function () {
		const response = await fetch('/people');
		const people = await response.json();
		return Object.values(people.people);
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
