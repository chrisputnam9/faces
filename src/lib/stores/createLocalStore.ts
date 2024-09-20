/**
 * Use this function to create a new local storage store
 */

import { writable } from 'svelte/store';
import { util } from '$lib/util';

// Listen for changes to local storage and update registered stores
// TODO

export function createLocalStore (key, default_value=null) {

	const { subscribe, set } = writable(JSON.stringify(default_value));

	if (typeof window === 'undefined') {
		throw new Error('Local storage can only be used in the browser');
	}

	const store_interface = {
		subscribe: function (callback, invalidate=util.noop) {
			return subscribe(function (value_string) {
				// Parse the JSON since that's how we store the value - see '.set'
				const value = JSON.parse(value_string);
				return callback(value);
			}, invalidate);
		},
		set: function (value) {

			if (util.isNullorUndefined(value)) {
				value = default_value;
			}
			
			const value_string = JSON.stringify(value);
			// We store the value as a JSON string in the store as well
			// to avoid issues with updates via other references to the object
			localStorage.setItem(key, value_string);
			set(value_string);
		},
		update: function (callback) {
			const local_value = localStorage.getItem(key);
			const updated_value = callback(JSON.parse(local_value));
			this.set(updated_value);
		}
	};

	// Prime the store with either:
	//  - The value from local storage, if there is one set
	//  - The default value otherwise
	let initial_value = default_value;
	const local_value_raw = localStorage.getItem(key);
	if ( ! util.isNullorUndefined(local_value_raw)) {
		initial_value = JSON.parse(local_value_raw);
	}
	store_interface.set(initial_value);

	// TODO - Register this store for updates to local storage?
	// In theory this could allow for useful multi-tab behaviors
	// Might need a lot of testing

	return store_interface;
}
