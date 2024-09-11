/**
 * Use this function to create a new local storage store
 */

import { get, writable } from 'svelte/store';

// Listen for changes to local storage and update registered stores
// TODO

export function createLocalStore (key, default_value=null) {

	const { subscribe, set } = writable(default_value);

	if (typeof window === 'undefined') {
		throw new Error('Local storage can only be used in the browser');
	}

	// Prime the store with the value from local storage, if any
	const local_value_raw = localStorage.getItem(key);

	console.log({
		local_value_raw,
		parsed: JSON.parse(local_value_raw),
	});

	if (local_value_raw !== null) {

		console.log({
			local_value_raw,
			parsed: JSON.parse(local_value_raw),
		});

		const local_value = JSON.parse(local_value_raw);

		console.log({
			local_value_raw,
			parsed: JSON.parse(local_value_raw),
			local_value
		});

		set(local_value);

		console.log({
			local_value_raw,
			parsed: JSON.parse(local_value_raw),
			local_value
		});

		if (key === 'sync') {
			console.log('Localstore sync loaded from local storage:', local_value_raw, local_value);
		}
	} else {
		// If nothing in local storage, set the default value
		localStorage.setItem(key, JSON.stringify(default_value));
		if (key === 'sync') {
			console.log('Localstore sync set local storage:', local_value);
		}
	}

	console.log('-- store ', key, get({subscribe}));

	// Register this store for updates to local storage?
	// In theory this could allow for useful multi-tab behaviors
	// Might need a lot of testing
	// TODO

	return {
		subscribe,
		set: function (value) {
			console.log('LocalStore.set:', key, value);
			localStorage.setItem(key, JSON.stringify(value));
			set(value);
		},
		update: function (callback) {
			console.log('LocalStore.update:', key, value);
			const local_value = localStorage.getItem(key);
			const updated_value = callback(JSON.parse(local_value));
			this.set(updated_value);
		}
	}
}
