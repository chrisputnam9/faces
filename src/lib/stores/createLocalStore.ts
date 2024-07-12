/**
 * Use this function to create a new local storage store
 */

import { writable } from 'svelte/store';

export function createLocalStore (key, initial_value=null) {

	const store = writable(initial_value);

	// TODO

	return store;
}
