import { writable, get } from 'svelte/store';
import { util } from '$lib/util';

/** Boolean states - either is or is not **/
export const dataSyncIsAvailableForSignIn = writable(false);
export const dataSyncIsSignedIn = writable(false);

export const dataSyncLoading = writable(true);

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
// - We store actual data in its own key to allow easy change comparison
let updated_at = 0;
if (typeof window !== 'undefined') {
	const _updated_at = localStorage.getItem('updated_at');
	if (_updated_at !== null) {
		updated_at = parseInt(_updated_at);
	}
}
// console.log('updated_at initialized as:', updated_at);
const _dataSyncable = writable(JSON.stringify({updated_at, "data": {}}));
export const dataSyncable = {
	subscribe: function (callback, invalidate=util.noop) {
		return _dataSyncable.subscribe(function (value_string) {
			// Parse the JSON since that's how we store the value
			const value = JSON.parse(value_string);
			return callback(value);
		}, invalidate);
	},
	/**
	 * Internal set logic - used by both set and update
	 */
	_maybeSet: function (ds_value, value_new, update_timestamp=true) {

		const data_samish = util.areSamish(value_new.data, ds_value.data);
		const time_samish = value_new.updated_at === ds_value.updated_at;

		//console.log({
			//'method': 'dataSyncable._maybeSet',
			//data_samish,
			//time_samish,
			//update_timestamp,
			//ds_value,
			//value_new,
		//});

		/* If there's no actual change of data, then we don't do anything */
		if (data_samish && time_samish) {
			return;
		}

		// Update timestamp for data change unless specified otherwise
		if (update_timestamp && !data_samish) {
			// Update the updated_at timestamp
			value_new.updated_at = util.timestamp();
		}

		// Save updated timestamp to local storage if it changed
		if (value_new.updated_at !== ds_value.updated_at) {
			localStorage.setItem('updated_at', value_new.updated_at);
		}

		// Update data & time on store value
		ds_value.data = value_new.data;
		ds_value.updated_at = value_new.updated_at;

		// Store as JSON to avoid issues with mutations
		const ds_value_string = JSON.stringify(ds_value);
		_dataSyncable.set(ds_value_string);
	},
	/**
	 * Internal get logic - get parsed JSON value of _dataSyncable
	 */
	_getParsed: function () {
		return JSON.parse(get(_dataSyncable));
	},
	set: function (value_new, update_timestamp=true) {
		//console.log({
			//'method': 'dataSyncable.set',
			//value_new,
			//update_timestamp,
		//});
		const ds_value = dataSyncable._getParsed();
		dataSyncable._maybeSet(ds_value, value_new, update_timestamp);
	},
	update: function(callback, update_timestamp=true) {
		const ds_value = dataSyncable._getParsed();
		const value_new = callback(util.objectClone(ds_value));
		//console.log({
			//'method': 'dataSyncable.update',
			//value_new,
			//update_timestamp,
		//});
		dataSyncable._maybeSet(ds_value, value_new, update_timestamp);
	},
	syncWith: function (store, key) {
		//console.log({
			//'method': 'dataSyncable.syncWith',
			//key,
		//});
		// Initialize dataSyncable with the store's value
		dataSyncable.update(ds => {
			const store_value = get(store);
			ds.data[key] = store_value;
			return ds;
		}, false); // false to avoid updating timestamp

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
			const new_ds_key_value = new_ds_value.data[key] ?? null;
			const are_samish = util.areSamish(store_value, new_ds_key_value);
			//console.log({
				//'method': 'dataSyncable.syncTo',
				//key,
				//store_value,
				//new_ds_key_value,
				//are_samish,
			//});
			if (are_samish) {
				return;
			}
			store.set(new_ds_key_value);
		});
	},
	// Update dataSyncable when store changes
	syncFrom: function (store, key) {
		store.subscribe(new_store_value => {
			// If no change, no need to trigger updates
			const ds_value = dataSyncable._getParsed();
			const ds_key_value = ds_value.data[key] ?? null;
			const are_samish = util.areSamish(ds_key_value, new_store_value);
			//console.log({
				//'method': 'dataSyncable.syncFrom',
				//key,
				//ds_key_value,
				//new_store_value,
				//are_samish,
			//});
			if (are_samish) {
				return;
			}
			dataSyncable.update(ds => {
				ds.data[key] = new_store_value;
				return ds;
			});
		});
	},
};
