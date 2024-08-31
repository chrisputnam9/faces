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
		_dataSyncable.set(value);
	},
	setWithoutTimestampChange: _dataSyncable.set,
	update: function(callback) {
		_dataSyncable.update(function(value) {
			const new_value = callback(value);
			new_value.updated_at = util.timestamp();
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
			if (get(store)[key] ?? null === new_ds_value) return;
			store.set(new_ds_value[key]);
		});
	},
	// Update dataSyncable when store changes
	syncFrom: function (store, key) {
		store.subscribe(new_store_value => {
			// If no change, no need to trigger updates
			const dsValue = get(dataSyncable);
			if (dsValue[key] ?? null === new_store_value) return;
			dataSyncable.update(ds => {
				ds[key] = new_store_value;
				return ds;
			});
		});
	},
};
