/**
 * People Store
 */

import { writable } from 'svelte/store';
import { dataInterface } from '$lib/data';
import { page } from '$app/stores';
import { goto } from '$app/navigation';

const { subscribe:people_subscribe, set:people_set, update:people_update } = writable({
	all: [],
	filtered: []
});

const { subscribe:filter_keywords_subscribe, set:filter_keywords_set } = writable('');

let url_search_params = null;
let url_keywords = '';
let filter_keywords = '';

export const PeopleStore = {
	subscribe: people_subscribe,
	load: async function () {
		const all = await dataInterface.loadPeople();
		all.sort((a, b) => a.name.localeCompare(b.name));
		people_set({ all, filtered: all });

		// Listen for URL change and filter
		page.subscribe((page) => {
			// Filter on 'pq' query string
			url_search_params = page.url.searchParams;
			url_keywords = url_search_params.get('pq');
			if (url_keywords === null) {
				url_keywords = '';
			}
			if (url_keywords !== filter_keywords) {
				this.filter_keywords.set(url_keywords);
			}
		});
	},
	filter_keywords: {
		subscribe: filter_keywords_subscribe,
		set: function (keywords) {
			filter_keywords = keywords;

			filter_keywords_set(keywords);

			// Update Page URL if keywords have changed
			if (keywords !== url_keywords) {
				const query = new URLSearchParams(url_search_params.toString());
				query.set('pq', keywords);
				goto(`?${query.toString()}`, {keepFocus: true});
			}

			people_update((data) => {
				data.filtered = data.filtered;
				if (keywords === '') {
					return data;
				}
				try {
					const regex = new RegExp(keywords, 'i');
					data.filtered = data.all.filter((person) => {
						return person.__json.match(regex);
					});
				} catch (e) {
					// Error is probably bad regex - use exact match instead
					data.filtered = data.all.filter((person) => {
						return person.__json.match(keywords);
					});
				}

				return data;
			});
		},
	}
};
