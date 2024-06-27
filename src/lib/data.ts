/**
 * Data Interface
 */

export const dataInterface = {
	state_guess_weights: {
		loading: 0,
		in_progress: 0,
		correct: 100,
		partially_correct: 10,
		incorrect: -5,
		gave_up: -200,
		impossible_no_images: -10 // Because ideally want to find images
	},

	loadPeopleOrdered: async function () {
		const people = await this.loadPeople();
		const tracking_data = await this.loadTracking();
		const tracking = tracking_data.tracking;

		// Set order weights based on tracking data
		for (const person of people) {
			const id = person.id;
			const guesses = tracking[id]?.guesses ?? {};

			const fact_object = {};
			for (const fact of person.facts) {
				fact_object[fact.name] = fact.value;
			}

			person.__order_weight = 0;
			person.__tracking = {
				guesses,
				totals: [],
				totalsObject: {}
			};
			for (const guess in this.state_guess_weights) {
				const guessCount = guesses[guess]?.length ?? 0;
				const weight = this.state_guess_weights[guess];
				person.__order_weight += guessCount * weight;
				const totals = {
					guess,
					guessCount
				}
				person.__tracking.totals.push(totals);
				person.__tracking.totalsObject[guess] = guessCount;
			}

			// Prioritize brand new people that haven't been guessed at all
			if (!('gave_up' in guesses) && !('correct' in guesses) && !('impossible_no_images' in guesses)) {
				person.__order_weight = -1000;
			}

			// Prioritize high tenure
			if ('Tenure' in fact_object) {
				const tenure_years = fact_object['Tenure'].replace(/^(\d+).*/, "$1");
				person.__order_weight -= (tenure_years * 10);
			}

			// Multiply by a factor of 1000
			person.__order_weight = person.__order_weight * 1000;

			// Then add or subtract a random number from 0-999 to shuffle and break ties
			const random_factor = Math.floor(Math.random() * 1000);
			if (person.__order_weight > 0) {
				person.__order_weight += random_factor;
			} else {
				person.__order_weight -= random_factor;
			}
		}

		// Sort by order weight with lowest weight first
		people.sort((a, b) => {
			return a.__order_weight - b.__order_weight;
		});

		console.log(people);

		return people;
	},

	loadMetrics: async function () {
		const people = await this.loadPeopleOrdered();
		const totals = {
			'all': people.length,
			'new': 0,
			'need_photo': 0,
			'unknown': 0,
			'learning': 0,
			'known': 0,
		};

		for (const person of people) {
			const guesses = person.__tracking.totalsObject;

			if (person.__order_weight > 0) {
				// Positive = well-known
				totals.known++;
			} else if (guesses.partially_correct > 0 || guesses.correct > 0) {
				// Got right or close at least once = we're getting there
				totals.learning++;
			} else if (guesses.incorrect > 0) {
				// Haven't even gotten close yet, and wrong at least once
				totals.unknown++;
			} else if (guesses.impossible_no_images > 0) {
				// Need to track down a photo
				totals.need_photo++;
			} else {
				// Otherwise, they're brand new - untested
				totals.new++;
			}

		}

		const percents = {
			'all': 100,
			'new': this.percent(totals.new, totals.all),
			'need_photo': this.percent(totals.need_photo, totals.all),
			'unknown': this.percent(totals.unknown, totals.all),
			'learning': this.percent(totals.learning, totals.all),
			'known': this.percent(totals.known, totals.all),
		};

		return {
			people,
			totals,
			percents
		};
	},

	percent: function (num, total) {
		return Math.round((num / total) * 10000) / 100;
	},

	trackGuess: async function ({ person, state_guess }) {
		const tracking_data = await this.loadTracking();
		const id = person.id;

		if (!(id in tracking_data.tracking)) {
			tracking_data.tracking[id] = {
				guesses: {}
			};
		}

		if (!(state_guess in tracking_data.tracking[id].guesses)) {
			tracking_data.tracking[id].guesses[state_guess] = [];
		}

		tracking_data.tracking[id].guesses[state_guess].push(new Date().toISOString());

		await this.saveTracking(tracking_data);
	},

	loadPeople: async function () {
		const data_people_raw = await this.loadRawPeople();
		const people_raw = data_people_raw.people;
		const people_processed = [];
		for (const id in people_raw) {
			const person_processed = people_raw[id];
			person_processed.__json = JSON.stringify(person_processed);
			people_processed.push(person_processed);
		}
		return Object.values(people_processed);
	},

	savePerson: async function (person) {
		const data_people = await this.loadRawPeople();
		const _autoincrement_id = data_people._autoincrement_id;
		const people = data_people.people;
		const person_raw = {};
		for (const key in person) {
			// By convention __ prefixed keys are not part of the actual 'data'
			if (key.substr(0, 2) === '__') continue;
			person_raw[key] = person[key];
		}
		people[person_raw.id] = person_raw;
		await this.saveRawPeople({ people, _autoincrement_id});
	},

	// Load from API route for now
	// TODO: Will read from Google Drive sync in the future
	loadRawPeople: async function () {
		const response = await fetch('/api/people');
		const data_people = await response.json();
		return data_people;
	},

	saveRawPeople: async function (data_people) {
		const rawResponse = await fetch('/api/people', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data_people)
		});
		const response = await rawResponse.json();

		if (!response.success) {
			console.error('Problem saving people data.', response.error);
		}
	},

	// Load from API route for now
	// TODO: Will read from Google Drive sync in the future
	loadTracking: async function () {
		const response = await fetch('/api/tracking');
		const tracking_data = await response.json();
		return tracking_data;
	},

	// Post to API route for now
	// TODO: Will write to Google Drive sync in the future
	saveTracking: async function (tracking) {
		const rawResponse = await fetch('/api/tracking', {
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
	},

	getPersonSlug: function (person) {
		// TODO
	},

	// Merge new people from import into existing data
	importMerge: function (new_people) {
		const data_people_old = this.loadRawPeople();
		const people_old = data_people_old.people;
		const autoincrement_id = data_people_old._autoincrement_id;
		const people_new_by_slug = {};
		const people_old_by_slug = {};
		for (const new_person of new_people) {
			const slug = dataInterface.getPersonSlug(new_person);
			people_new_by_slug[person.slug] = new_person;
		}
		// TODO
	},

	// Compare new people from import to existing data and list differences
	importCompare: function (new_people) {
		const data_people_old = this.loadRawPeople();
		const counts = {
			'same': 0,
			'create': 0,
			'update': 0,
			'delete': 0,
		};
		// TODO

		return counts;
	},
};
