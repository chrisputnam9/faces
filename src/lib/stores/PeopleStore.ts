/**
 * People Store
 */

import { writable } from 'svelte/store';
import { dataInterface } from '$lib/data';
import { page } from '$app/stores';
import { goto } from '$app/navigation';

const { subscribe:people_subscribe, set:people_set, update:people_update } = writable({
	all: [],
	filtered: [],
	filtered_metrics: []
});

const { subscribe:filter_keywords_subscribe, set:filter_keywords_set } = writable('');

let url_search_params = null;
let url_keywords = '';

export const PeopleStore = {
	count_imageless: 0,
	remove_imageless: false,
	alphabetical: false,
	subscribe: people_subscribe,
	load: async function () {
		let all = await dataInterface.loadPeopleOrdered();

		// Count and maybe remove imageless
		all = all.filter((person) => {
			if (person.images.length < 1) {
				PeopleStore.count_imageless++;
				if (PeopleStore.remove_imageless) {
					return false;
				}
			}
			return true;
		});

		if (this.alphabetical) {
			all.sort((a, b) => a.name.localeCompare(b.name));
		}

		const filtered_metrics = dataInterface.calculateMetrics(all);

		const new_data = { all, filtered: all, filtered_metrics};
		people_set(new_data);

		// Listen for URL change and filter
		page.subscribe(PeopleStore.page_update);
	},
	page_update: function (page) {
			// Filter on 'pq' query string
			url_search_params = page.url.searchParams;
			url_keywords = url_search_params.get('pq');
			if (url_keywords === null) {
				url_keywords = '';
			}

			PeopleStore.filter_keywords.set(url_keywords);
	},
	filter_keywords: {
		subscribe: filter_keywords_subscribe,
		set: function (keywords) {
			filter_keywords_set(keywords);

			// Update Page URL if keywords have changed
			if (keywords !== url_keywords) {
				const query = new URLSearchParams(url_search_params.toString());
				query.set('pq', keywords);
				goto(`?${query.toString()}`, {keepFocus: true});
			}

			people_update((data) => {
				data.filtered = data.all;
				if (keywords !== '') {
					let filtered = [];
					try {
						// Remove start/end "/" if both present
						const adjusted_keywords = keywords.replace(/^\/(.*)\/$/, '$1');
						const regex = new RegExp(adjusted_keywords, 'i');
						filtered = data.all.filter((person) => {
							return person.__json.match(regex);
						});
					} catch (e) {
						// Error is probably bad regex - will use exact match instead
					}

					// If no results, try exact match
					if (filtered.length < 1) {
						filtered = data.all.filter((person) => {
							return person.__json.includes(keywords);
						});
					}
					
					data.filtered = filtered;
				}
				data.filtered_metrics = dataInterface.calculateMetrics(data.filtered);

				return data;
			});
		}
	}
};
