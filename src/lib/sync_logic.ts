import { util } from '$lib/util.js';

/**
 * Logic to sync up local data with remote data
 *
 * TODO - logic is very simple, could be improved to check individual changes in the future
 */
export const syncData = (local_data, remote_data) => {

	if (remote_data.updated_at > local_data.updated_at) {
		return remote_data;
	}

	return local_data;
};

/**
 * Confirm if there was any actual change from a sync
 */
export const didSyncResultInChange = (data1, data2) => {

	const _data1 = util.objectClone(data1);
	const _data2 = util.objectClone(data2);

	delete _data1.updated_at;
	delete _data1.sync;
	delete _data2.updated_at;
	delete _data2.sync;

	return util.objectsDiffer(_data1, _data2);
};
