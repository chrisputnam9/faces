import { writable, get } from 'svelte/store';
import { util } from '$lib/util';

/** Boolean states - either is or is not **/
export const dataSyncIsAvailableForSignIn = writable(false);
export const dataSyncIsSignedIn = writable(false);

/**
 * Success state of current action:
 **/
export const DATA_SYNC_SAVE_STATE = {
	PENDING_LOGIN: 0,
	PENDING_SYNC: 1,
	IN_PROGRESS: 2,
	SUCCESS: 3,
	ERROR: 4
};
export const dataSyncSaveState = writable(DATA_SYNC_SAVE_STATE.PENDING_LOGIN);

/** Messages **/
// Whether to show the alert message
export const dataSyncMessageShow = writable(false);
// See Alert.svelte - CSS classes for types
export const dataSyncMessageType = writable('');
export const dataSyncMessage = writable('');
export const dataSyncAlert = function (message, type = 'info') {
	// Auto-set certain states
	switch (type) {
		case 'error':
			dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.ERROR);
			console.error(message);
			break;
		case 'success':
			dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.SUCCESS);
			console.info(message);
			break;
		default:
			console.log(message);
			break;
	}
	dataSyncMessageShow.set(true);
	dataSyncMessageType.set(type);
	dataSyncMessage.set(message);
};

/** Syncable Data **/
// Store for data that is syncable to remote sources and other app stores
// - We store the value as a JSON string in the store
//   to avoid issues with updates via other references to the object
// - We keep an updated_at timestamp based on when data actually changes
// - We store data in it's own key to allow easy change comparison
const _dataSyncable = writable(JSON.stringify({"updated_at": 0, "data": {}}));
export const dataSyncable = {
	subscribe: function (callback, invalidate=util.noop) {
		return _dataSyncable.subscribe(function (value_string) {
			// Parse the JSON since that's how we store the value
			const value = JSON.parse(value_string);
			return callback(value.data);
		}, invalidate);
	},
	/**
	 * Internal set logic - used by both set and update
	 */
	_maybeSet: function (ds_value, data_new, initial_load=false) {

		/* If there's no actual change, then we don't do anything */
		if ( util.areSamish(data_new, ds_value.data)) {
			return;
		}

		ds_value.data = data_new;

		// As long as this isn't just an initial load of data...
		if (!initial_load) {
			// Update the updated_at timestamp
			ds_value.updated_at = util.timestamp();
		}

		// Store as JSON to avoid issues with mutations
		const ds_value_string = JSON.stringify(ds_value);
		console.info('_maybeSet: Setting new value', ds_value_string);
		_dataSyncable.set(ds_value_string);
	},
	/**
	 * Internal get logic - get parsed JSON value of _dataSyncable
	 */
	_getParsed: function () {
		return JSON.parse(get(_dataSyncable));
	},
	set: function (data_new, initial_load=false) {
		const ds_value = dataSyncable._getParsed();
		dataSyncable._maybeSet(ds_value, data_new, initial_load);
	},
	update: function(callback, initial_load=false) {
		const ds_value = dataSyncable._getParsed();
		const data_new = callback(util.objectClone(ds_value.data));
		dataSyncable._maybeSet(ds_value, data_new, initial_load);
	},
	syncWith: function (store, key) {
		// Initialize dataSyncable with the store's value
		dataSyncable.update(ds => {
			const store_value = get(store);
			ds[key] = store_value;
			return ds;
		}, true); // true=initial_load

		// Update dataSyncable when store changes
		dataSyncable.syncFrom(store, key);

		// Update store when dataSyncable changes
		dataSyncable.syncTo(store, key);
	},
	// Update store when dataSyncable changes
	syncTo: function (store, key) {
		dataSyncable.subscribe(new_ds_value => {
			// If no change, no need to trigger updates
			const store_value = get(store);
			const new_ds_key_value = new_ds_value[key] ?? null;
			if (util.areSamish(store_value, new_ds_key_value)) {
				return;
			}
			console.info('Syncing dataSyncable to store', key, new_ds_key_value);
			store.set(new_ds_value[key]);
		});
	},
	// Update dataSyncable when store changes
	syncFrom: function (store, key) {
		store.subscribe(new_store_value => {
			// If no change, no need to trigger updates
			const ds_value = get(_dataSyncable);
			const ds_key_value = ds_value[key] ?? null;
			if (util.areSamish(ds_key_value, new_store_value)) {
				return;
			}
			dataSyncable.update(ds => {
				ds[key] = new_store_value;
				return ds;
			});
		});
	},
};
