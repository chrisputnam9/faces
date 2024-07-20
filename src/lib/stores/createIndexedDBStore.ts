/**
 * Use this function to create a new local storage store
 */

import { writable } from 'svelte/store';

// Static
const database_version = 1;
const valid_store_keys = ['people', 'tracking'];

// TODO - Add a way to listen for changes using local storage to help

// Generic Error Handler
const error_handler = function (event) {
	const message = 'Error 201: Problem with IndexedDB database - see console for more details';
	alert(message);
	console.error(message, event);
}

let db = null;
const get_db = async function () {

	if (db !== null) {
		return db;
	}

	// Open IndexedDB database and set up top-level error handling
  db = await new Promise(function (resolve) {
		const db_open_request = window.indexedDB.open('application', database_version);
		db_open_request.onerror = error_handler;
		db_open_request.onsuccess = (event) => {
			resolve(event.target.result);
		}
		db_open_request.onupgradeneeded = function (event) {
			const db = event.target.result;
			// Initialize all valid keyes as object stores as needed
			for (const key of valid_store_keys) {
				if (!db.objectStoreNames.contains(key)) {
					db.createObjectStore(key, { keyPath: 'id' });
				}
			}
		}
	});
	db.onerror = error_handler;

	return db;
}

export async function createIndexedDBStore (key, default_value={}) {

	// Make sure we can actually use IndexedDB
	if (typeof window === 'undefined') {
		throw new Error('IndexedDB storage can only be used in the browser');
	}
	if ( ! ('indexedDB' in window) ) {
		alert('Error: IndexedDB not supported in this browser');
		throw new Error('IndexedDB not supported in this browser');
	}
	if ( ! valid_store_keys.includes(key)) {
		alert('Error: Invalid key for IndexedDB store - ' + key);
		throw new Error('Invalid key for IndexedDB store - ' + key);
	}

	const { subscribe, set } = writable(default_value);
	const db = await get_db();

	async function getAllFromDB() {
		const request = db.transaction([key], 'readonly').objectStore(key).getAll();
		const event = await new Promise(resolve => request.onsuccess = resolve);
		const items = {};
		for (const item of event.target.result) {
			items[item.id] = item;
		}
		return items;
	}

	// Prime the store with existing data if any
	const database_items = await getAllFromDB();
	if (database_items !== null) {
		set(database_items);
	}

	return {
		subscribe,
		set: async function (items) {
			// For now, we just clear and re-add all the data
			const object_store = db.transaction([key], 'readwrite').objectStore(key);
			const clear_request = object_store.clear();
			await new Promise(resolve => clear_request.onsuccess = resolve);
			for (const id in items) {
				if ( ! ('id' in items[id])) {
					items[id].id = id;
				}

				const item_to_save = {};
				for (const key in items[id]) {
					// By convention __ prefixed keys are not part of the actual 'data'
					if (key.substr(0, 2) === '__') continue;
					item_to_save[key] = items[id][key];
				}

				object_store.add(item_to_save);
			}
			set(items);
		},
		update: async function (callback) {
			const database_items = await getAllFromDB();
			const updated_items = callback(database_items);
			this.set(updated_items);
		}
	}
}
