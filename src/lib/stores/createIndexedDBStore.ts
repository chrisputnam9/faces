/**
 * Use this function to create a new local storage store
 */

import { writable } from 'svelte/store';

// TODO - Add a way to listen for changes using local storage to help

export async function createIndexedDBStore (key, identifier='id', default_value=null) {

	if (typeof window === 'undefined') {
		throw new Error('IndexedDB storage can only be used in the browser');
	}

	const { subscribe, set, update } = writable(default_value);
	let db;
	
	// Generic Error Handler
	function error_handler(event) {
		const message = 'Error 201: Problem with IndexedDB database - see console for more details';
		alert(message);
		console.error(message, event);
	}

	// Promisified Transactions
	// - action should be a callback which
	//   -- takes the object store as an argument and
	//   -- returns a request or null
	function transaction (action, readwrite='readonly') {
		return new Promise(function (resolve) {
			const transaction = db.transaction([key], readwrite);
			const object_store = transaction.objectStore(key);
			const request = action(object_store);
			if (request === null) {
				transaction.oncomplete = function (event) {
					resolve(event);
				};
				return;
			}
			request.onsuccess = function (event) {
				resolve(event.target.result);
			}
		});
	}

	// Open IndexedDB database and set up top-level error handling
	db = await new Promise(function (resolve) {
		const db_open_request = window.indexedDB.open('application', 1);
		db_open_request.onerror = error_handler;
		db_open_request.onsuccess = (event) => {
			resolve(event.target.result);
		}
	});
	db.onerror = error_handler;

	// Initialize the object store
	const object_store = db.createObjectStore(key, { keyPath: identifier });

	// Prime the store with existing data if any
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
