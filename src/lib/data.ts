/**
 * Data Interface
 */

export const data = {

	state_guess_weights: {
		'loading': 0,
		'in_progress': -10,
		'correct': 100,
		'partially_correct': 10,
		'incorrect': -300,
		'gave_up': -300,
		'impossible_no_images': -10, // Because ideally want to find images or *something*
	},

	loadPeopleOrdered: async function () {
		const people = await this.loadPeople();
		const tracking_data = await this.loadTracking();
		const tracking = tracking_data.tracking;

		// Set order weights based on tracking data
		for (const person of people) {
			const id = person.id;
			const guesses = tracking[id]?.guesses ?? {};
			person.order_weight = 0;
			for (const guess in guesses) {
				const guessCount = guesses[guess].length;
				const weight = this.state_guess_weights[guess] ?? 0;
				person.order_weight += guessCount * weight;
			}

			// Multiply by a factor of 1000
			person.order_weight = person.order_weight * 1000;

			// Then add or subtract a random number from 0-999 to shuffle and break ties
			const random_factor = Math.floor(Math.random() * 1000);
			if (person.order_weight > 0) {
				person.order_weight += random_factor;
			}
			else {
				person.order_weight -= random_factor;
			}
		}

		// Sort by order weight with lowest weight first
		people.sort((a, b) => {
			return a.order_weight - b.order_weight;
		});

		return people;
	},
	trackGuess: async function ({person, state_guess}) {
		const tracking_data = await this.loadTracking();
		const id = person.id;

		if ( ! (id in tracking_data.tracking) ) {
			tracking_data.tracking[id] = {
				'guesses': {},
			};
		}

		if ( ! (state_guess in tracking_data.tracking[id].guesses) ) {
			tracking_data.tracking[id].guesses[state_guess] = [];
		}

		tracking_data.tracking[id].guesses[state_guess].push(new Date().toISOString());

		await this.saveTracking(tracking_data);
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
		const tracking_data = await response.json();
		return tracking_data;
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
