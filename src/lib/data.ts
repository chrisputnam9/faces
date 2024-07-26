/**
 * Data Interface
 */

import { createIndexedDBStore } from '$lib/stores';
import { createLocalStore } from '$lib/stores';
import { get } from 'svelte/store';
import { google_drive } from '$lib/google_drive';

export const dataInterface = {

	peopleAutoincrementLocalStore: null,
	peopleIndexedDBStore: null,
	trackingIndexedDBStore: null,

	init: async function () {
		if (this.peopleIndexedDBStore !== null) return;

		google_drive.init();

		this.peopleAutoincrementLocalStore = createLocalStore('people_autoincrement', 0);
		this.peopleIndexedDBStore = await createIndexedDBStore('people');
		this.trackingIndexedDBStore = await createIndexedDBStore('tracking');
	},

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

		return people;
	},

	calculateMetrics: function (_people) {
		const people = structuredClone(_people);
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
		if (total === 0) return 0;
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

	loadRawPeople: async function () {
		await this.init();

		const people = await get(this.peopleIndexedDBStore);
		const autoincrement_id = await get(this.peopleAutoincrementLocalStore);

		return {
			people,
			_autoincrement_id: autoincrement_id
		};
	},

	saveRawPeople: async function (data_people) {
		await this.init();

		// Save to IndexedDB
		this.peopleIndexedDBStore.set(data_people.people);
		this.peopleAutoincrementLocalStore.set(data_people._autoincrement_id);
	},

	loadTracking: async function () {
		await this.init();

		const tracking = await get(this.trackingIndexedDBStore);

		return {tracking};
	},

	saveTracking: async function (tracking) {
		await this.init();

		// Save to IndexedDB
		this.trackingIndexedDBStore.set(tracking.tracking);
	},

	person_slug_uniqueness: {},
	getPersonSlug: function (person) {

		let slug = '';

		// If they already have an ID, backtrack slug from that to stay consistent
		if ('id' in person) {
			slug = person.id.replace(/^\d+-(.*)$/, '$1');
		};

		// If empty or non-unique slug, create a new one
		if (slug === '' || slug in dataInterface.person_slug_uniqueness) {
			slug = dataInterface.slugify(person.name);
		}

		// If still empty or non-unique slug, try email
		if (slug === '' || slug in dataInterface.person_slug_uniqueness) {
			slug = dataInterface.slugify(person.emails[0] ?? '');
		}

		// If still empty or non-unique slug, throw an error
		if (slug === '' || slug in dataInterface.person_slug_uniqueness) {
			const error = `Person may have duplicate, empty or otherwise problematic name and email (${person.name} - ${person.emails[0]}).`
			alert(`Error: ${error}`);
			throw new Error(error);
		}

		dataInterface.person_slug_uniqueness[slug] = 1;

		return slug;
	},
	slugify: function (text) {
		return text.toLowerCase().replace(/[^a-z]+/g, '-').trim();
	},

	// Merge new people from import into existing data
	importMerge: async function (people_new) {
		const data_people_old = await this.loadRawPeople();
		const people_old = Object.values(data_people_old.people);
		let autoincrement_id = data_people_old._autoincrement_id;
		const people_new_by_slug = {};
		const people_old_by_slug = {};

		const people_merged = {};

		// Process new people and align autoincrement_id
		// - Reset uniqueness tracker for new people
		dataInterface.person_slug_uniqueness = {};
		for (const person_new of people_new) {
			const slug = dataInterface.getPersonSlug(person_new);
			people_new_by_slug[slug] = person_new;
			autoincrement_id = dataInterface.alignAutoincrementIdToPerson(autoincrement_id, person_new);
		}

		// Process existing people and align autoincrement_id
		// - Reset uniqueness tracker for old people
		dataInterface.person_slug_uniqueness = {};
		for (const person_old of people_old) {
			const slug = dataInterface.getPersonSlug(person_old);
			people_old_by_slug[slug] = person_old;
			autoincrement_id = dataInterface.alignAutoincrementIdToPerson(autoincrement_id, person_old);
		}

		// Loop through existing people
		for (const slug in people_old_by_slug) {
			const person_old = people_old_by_slug[slug];

			// - if person exists in new data, add new data into existing data
			if (slug in people_new_by_slug) {
				people_merged[person_old.id] = dataInterface.importMergePerson(person_old,people_new_by_slug[slug]);
			} else {
				// - if person does not exist in new data, we'll drop them
				// - eg. just don't add them to people_merged
			}
			// - either way, remove them from new data so we know who's left
			delete people_new_by_slug[slug];
		}

		// Loop through remaining new data (truly new people to add)
		for (const slug in people_new_by_slug) {
			const person_new = people_new_by_slug[slug];
			if ( ! ('id' in person_new)) {
				autoincrement_id++;
				person_new.id = `${autoincrement_id}-${slug}`;
			}
			people_merged[person_new.id] = person_new;
		}

		const data_merged = {
			people: people_merged,
			_autoincrement_id: autoincrement_id
		};

		const stats = dataInterface.importCompare(data_people_old.people, people_merged);

		return {data_merged, stats};
	},

	// Check a set of people against autoincrement_id and update if needed
	alignAutoincrementIdToPerson: function (autoincrement_id, person) {
		if ( ! ('id' in person)) return autoincrement_id;
		const id_parts = person.id.split('-');
		const id_number = parseInt(id_parts[0]);
		if (id_number > autoincrement_id) {
			autoincrement_id = id_number;
		}
		return autoincrement_id;
	},

	// Merge new person from import into existing data with some special logic
	importMergePerson: function (person_old, person_new) {
		const person_merged = structuredClone(person_old);
		for (const key in person_new) {
			// Some fields are special and need to be merged
			if (['images'].includes(key)) {
				// Merge and make unique
				person_merged[key] = [...new Set(person_old[key].concat(person_new[key]))];
				continue;
			}

			// If no special logic, just use the new value
			person_merged[key] = person_new[key];
		}
		return person_merged;
	},

	// Compare new people from import to existing data and list differences
	importCompare: function (_people_old, _people_merged) {
		const people_old = structuredClone(_people_old);
		const people_merged = structuredClone(_people_merged);
		const stats = {
			'delete': [], // Only in old
			'update': [], // In both but different
			'create': [], // Only in merged
			'same': [], // Old and merged identical
		};

		for (const id in people_old) {
			const stat_object = {
				id,
				old: people_old[id],
				new: null,
				diffs: [],
			};
			if (id in people_merged) {

				stat_object.new = people_merged[id];

				// JSON for comparison
				const people_old_json = JSON.stringify(people_old[id]);
				const people_merged_json = JSON.stringify(people_merged[id]);

				// Compare JSON see if same or updated
				if (people_old_json === people_merged_json) {
					stats.same.push(stat_object);
				} else {
					stats.update.push(stat_object);
					// Add diffs
					for (const key in people_old[id]) {
						const value_old_json = JSON.stringify(people_old[id][key]);
						const value_merged_json = JSON.stringify(people_merged[id][key]);
						if (value_old_json !== value_merged_json) {
							stat_object.diffs.push({
								key,
								old: people_old[id][key],
								new: people_merged[id][key],
							});
						}
					}
				}

				// Either way, remove so we know what's brand-new
				delete people_merged[id];
				continue;
			}

			// If not in merged, it's being deleted
			stats.delete.push(stat_object);
		}

		// Anything left in merged is brand new
		for (const id in people_merged) {
			stats.create.push({
				id,
				old: null,
				new: people_merged[id],
				diffs: [],
			});
		}

		for (const stat in stats) {
			const stat_object = {
				count: stats[stat].length,
				detail: stats[stat],
			};
			stats[stat] = stat_object;
		}

		return stats;
	},

	// Generate explanatiosn of import comparison stats
	explainImportStats: function (stats) {

		const explain = {
			delete: {summary: '', details: []},
			update: {summary: '', details: []},
			create: {summary: '', details: []},
			same: {summary: '', details: []},
		};

		if (stats.same.count > 0) {
			const p_noun = stats.same.count === 1 ? 'person' : 'people';
			explain.same.summary = `${stats.same.count} ${p_noun} will be unaffected.`;
			explain.same.details = stats.same.detail.map(detail => {
				return `${detail.old.name} will be unaffected.`;
			});
		}

		if (stats.create.count > 0) {
			const p_noun = stats.create.count === 1 ? 'person' : 'people';
			explain.create.summary = `${stats.create.count} new ${p_noun} will be created.`;
			explain.create.details = stats.create.detail.map(detail => {
				return `${detail.new.name} will be created.`;
			});
		}

		if (stats.delete.count > 0) {
			const p_noun = stats.delete.count === 1 ? 'person' : 'people';
			explain.delete.summary = `${stats.delete.count} ${p_noun} will be deleted.`;
			explain.delete.details = stats.delete.detail.map(detail => {
				return `${detail.old.name} will be deleted.`;
			});
		}

		if (stats.update.count > 0) {
			const diff_fields_object = {};
			for (const detail of stats.update.detail) {
				for (const diff of detail.diffs) {
					if ( ! (diff.key in diff_fields_object)) {
						diff_fields_object[diff.key] = 0;
					}
					explain.update.details.push(`${detail.old.name} - ${diff.key} changing from "${JSON.stringify(diff.old)}" to "${JSON.stringify(diff.new)}"`);
					diff_fields_object[diff.key]++;
				}
			}
			const diff_fields = JSON.stringify(diff_fields_object)
				.replace(/[{}]/g, '')
				.replaceAll(',', ', ')
				.replaceAll('"', '');
			const p_noun = stats.update.count === 1 ? 'person' : 'people';
			explain.update.summary = `${stats.update.count} existing ${p_noun} will be updated.
   --- Fields updated: ${diff_fields}`;
		}

		return explain;
	}
};
