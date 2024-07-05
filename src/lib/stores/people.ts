/**
 * People Store
 */

import { readable } from 'svelte/store';
import { dataInterface } from '$lib/data';
import { page } from '$app/stores';

const {subscribe, set, update} = readable({
	people_all: null,
	people_filtered: null,
});

export const people = {
	subscribe,
	load: async function () {
		const people_all = dataInterface.loadPeople();
		people_all.sort((a, b) => a.name.localeCompare(b.name));
		set({people_all, people_filtered: people_all});
		page.subscribe((page) => {
			// Filter on 'pq' query string
			const keywords = page.query.get('pq');
			if (keywords) {
				this.filter(keywords);
			}
		});

	},
	filter: function (keywords) {
		console.log(keywords);
		update((data) => {
			const people_all = data.people_all;
			let people_filtered = data.people_filtered;
			try {
				const regex = new RegExp(keywords, 'i');
				people_filtered = people_all.filter((person) => {
					return person.__json.match(regex);
				});
			} catch (e) {
				// Error is probably bad regex - use exact match instead
				people_filtered = people_all.filter((person) => {
					return person.__json.match(keywords);
				});
			}

			return data;
		});
	},
}
