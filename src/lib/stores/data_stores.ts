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
const _dataSyncable = writable({'updated_at': 0});
export const dataSyncable = {
	subscribe: _dataSyncable.subscribe,
	set: function (value) {
		value.updated_at = util.timestamp();
		console.info(' - dataSyncable updated:', value);
		_dataSyncable.set(value);
	},
	setWithoutTimestampChange: _dataSyncable.set,
	update: function(callback) {
		_dataSyncable.update(function(value) {
			const new_value = callback(value);
			new_value.updated_at = util.timestamp();
			console.info(' - dataSyncable updated:', new_value);
			return new_value;
		});
	},
	updateWithoutTimestampChange: _dataSyncable.update,
	syncWith: function (store, key) {
		// Initialize dataSyncable with the store's value
		dataSyncable.update(ds => {
			ds[key] = store[key];
			return ds;
		});
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
			if (store_value ?? null === new_ds_key_value) return;
			console.info(`updating store based on change to dataSyncable[${key}] - from ${store_value} to ${new_ds_key_value}`);
			store.set(new_ds_value[key]);
		});
	},
	// Update dataSyncable when store changes
	syncFrom: function (store, key) {
		store.subscribe(new_store_value => {
			// If no change, no need to trigger updates
			const ds_value = get(_dataSyncable);
			const ds_key_value = ds_value[key] ?? null;
			if (ds_key_value === new_store_value) return;
			console.info(`updating dataSyncable[${key}] based on change to store - from ${ds_key_value} to ${new_store_value}`);
			dataSyncable.update(ds => {
				ds[key] = new_store_value;
				return ds;
			});
		});
	},
};
