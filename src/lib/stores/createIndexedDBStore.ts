/**
 * Use this function to create a new local storage store
 */

import { writable } from 'svelte/store';

// TODO - Add a way to listen for changes using local storage to help

export async function createIndexedDBStore (key, identifier='id', default_value=null) {

	const { subscribe, set, update } = writable(default_value);

	if (typeof window === 'undefined') {
		throw new Error('IndexedDB storage can only be used in the browser');
	}
	
	function error_handler(event) {
		const message = 'Error 201: Problem with IndexedDB database - see console for more details');
		alert(message);
		console.error(message, event);
	}

	// Open IndexedDB database and set up error handling
	const db = await new Promise(function (resolve) {
		const db_open_request = window.indexedDB.open('application', 1);
		db_open_request.onerror = error_handler;
		db_open_request.onsuccess = (event) => {
			resolve(event.target.result);
		}
	});
	db.onerror = error_handler;

	// Initialize Object Store and wait for that to be complete
	const object_store = new Promise(function (resolve) {
		db.createObjectStore(key, { keyPath: identifier });
		transaction.oncomplete = resolve;
	});

	function transation_promise () {
		return new Promise((resolve) => {
			const transaction = db.transaction([key], 'readwrite');
			transaction.onerror = error_handler;
			transaction.oncomplete = () => {
				resolve();
			};
		});
	
	}

	// Prime the store with the value from local storage, if any
	const local_value = localStorage.getItem(key);
	if (local_value !== null) {
		set(JSON.parse(local_value));
	} else {
		// If nothing in local storage, set the default value
		localStorage.setItem(key, JSON.stringify(default_value));
	}

	return {
		subscribe,
		set: function (value) {
			localStorage.setItem(key, JSON.stringify(value));
			set(value);
		},
		update: function (callback) {
			const local_value = localStorage.getItem(key);
			const updated_value = callback(JSON.parse(local_value));
			this.set(updated_value);
		}
	}
}
