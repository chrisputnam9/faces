import { get } from 'svelte/store';
import { syncData, didSyncResultInChange } from './sync_logic';
import { util } from './util';
import { createLocalStore } from './stores';
import {
	DATA_SYNC_SAVE_STATE,
	dataSyncAlert,
	dataSyncIsAvailableForSignIn,
	dataSyncIsSignedIn,
	dataSyncSaveState,
	dataSyncMessageShow,
	dataSyncable
} from './stores/data_stores';
import MultiPartBuilder from './multipart';

import { PUBLIC_GOOGLE_DRIVE_API_KEY, PUBLIC_GOOGLE_DRIVE_CLIENT_ID } from '$env/static/public';

/**
 * Workflow:
 * On People Manage Screen:
 * 1. If not logged in, show login button
 * 2. When log in clicked, authorize with GDrive
 * 3. If authorized, show sync button
 * 4. When sync clicked, run sync function
 *
 * On All Screens:
 * 1. If logged in, check last sync time
 * 2. If not synced less than 1 day ago, run sync
 */

export const google_drive = {
	gapi: null,
	google: null,
	tokenClient: null,

	dataFileId: 0,

	syncNeeded: null,

	emailLocalStore: null,
	tokenLocalStore: null,
	tokenExpiresLocalStore: null,

	initLocalStores: async function () {
		if (google_drive.emailLocalStore !== null) return;

		google_drive.emailLocalStore = createLocalStore('google_drive_user_login_email', '');
		google_drive.tokenLocalStore = createLocalStore('google_drive_gapi_client_token', '');
		google_drive.tokenExpiresLocalStore = createLocalStore('google_drive_gapi_client_token_expires', '');

		console.log('Creating sync local store');
		const sync = createLocalStore('sync', {
			google_drive: {
				synced_at: 0,
				file_id: 0,
			}
		});
		const store_value = get(sync);
		console.log('Sync local store created with value:', store_value);
		console.log('Linking sync store with dataSyncable key');
		dataSyncable.syncWith(sync, 'sync');
		console.log('Done linking sync store');
	},

	/**
	 * Initialize GAPI and GIS
	 * - Run by the Data Interface's init
	 * - So, it will init as soon as people are loaded on any page
	 */
	init: async function () {
		google_drive.initLocalStores();

		// Load and initialize gapi.client
		google_drive.gapi = await util.newWindowVarPromise('gapi');
		await new Promise((resolve, reject) => {
			google_drive.gapi.load('client', { callback: resolve, onerror: reject });
		});
		await google_drive.gapi.client
			.init({
				apiKey: PUBLIC_GOOGLE_DRIVE_API_KEY
			})
			.then(async function () {
				await google_drive.gapi.client.load(
					'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
				);
			});

		// Load the GIS client
		// Not building UX for this for now
		// - but email could be saved here to make future logins faster
		const email = await get(google_drive.emailLocalStore);
		google_drive.google = await util.newWindowVarPromise('google');
		await new Promise((resolve, reject) => {
			try {
				google_drive.tokenClient = google_drive.google.accounts.oauth2.initTokenClient({
					client_id: PUBLIC_GOOGLE_DRIVE_CLIENT_ID,
					scope:
						'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file',
					hint: email,
					callback: '' // defined at request time in await/promise scope.
				});
				resolve();
			} catch (err) {
				reject(err);
			}
		});

		// Listen for sign in or data change and check for possible sync needed
		// - Needs to happen after Google SDK is fully loaded
		dataSyncIsSignedIn.subscribe(google_drive.maybeShowSyncNeededAlert);
		dataSyncable.subscribe(google_drive.maybeShowSyncNeededAlert);

		dataSyncIsAvailableForSignIn.set(true);

		// See if we have a token saved in local storage already
		try {
			const token = await get(google_drive.tokenLocalStore);
			if (!token) throw new Error('No Google account token saved in local storage');

			google_drive.gapi.client.setToken(token);
			dataSyncIsSignedIn.set(true);
			dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.PENDING_SYNC);

			// See if the token has expired
			// - if so, we'll try to get a new one right away
			// - as opposed to waiting for a failed request
			const token_expires = await get(google_drive.tokenExpiresLocalStore);
			if (token_expires !== '') {
				if (Math.ceil(Date.now() / 1000) > parseInt(token_expires)) {
					console.warn(
						'The Google account token in local storage has expired - attempting to get a new one'
					);
					google_drive.getToken();
				}
			}

			return;
		} catch (error) {
			console.warn('NOT logged in due to invalid local Google account token\n', error);
		}

		dataSyncIsSignedIn.set(false);
		dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.PENDING_LOGIN);
	},

	/**
	 * Get a fresh valid token
	 */
	logIn: function () {
		google_drive.getToken();
	},

	/**
	 * Invalidate the current token/session
	 */
	logOut: function () {
		google_drive.gapi.client.setToken(null);
		google_drive.tokenLocalStore.set('');
		google_drive.tokenExpiresLocalStore.set('');
		dataSyncIsSignedIn.set(false);
	},

	getToken: async function (error) {
		if (
			typeof error === 'undefined' ||
			(error.result?.error?.code ?? 0) == 401 ||
			((error.result?.error?.code ?? 0) == 403 && error.result.error.status == 'PERMISSION_DENIED')
		) {
			// The access token is missing, invalid, or expired, prompt for user consent to obtain one.
			await new Promise((resolve, reject) => {
				try {
					// Settle this promise in the response callback for requestAccessToken()
					google_drive.tokenClient.callback = resp => {
						if (resp.error !== undefined) {
							reject(resp);
						}
						// GIS has automatically updated gapi.client with the newly issued access token.
						const token = google_drive.gapi.client.getToken();
						// We save it into local storage for next time
						google_drive.tokenLocalStore.set(token);

						// Note when the token will expire
						const token_expires = Math.floor(Date.now() / 1000) + token.expires_in;
						google_drive.tokenExpiresLocalStore.set(token_expires);

						dataSyncIsSignedIn.set(true);
						dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.PENDING_SYNC);

						resolve(resp);
					};

					// Handle errors
					google_drive.tokenClient.error_callback = error => {
						switch (error.type) {
							case 'popup_closed':
								reject('Google login canceled by closing popup');
								break;
							case 'popup_failed_to_open':
								reject(
									'Google account connection failed because popup window did not open.<br>Check browser settings for popups on this site.'
								);
								break;
							default:
								reject(error.message);
								break;
						}
					};

					// Request the token now that callbacks are in place
					google_drive.tokenClient.requestAccessToken({ prompt: '' });
				} catch (error) {
					reject(error);
				}
			}).catch(error => {
				dataSyncAlert(error, 'error');
			});
		} else {
			// Errors unrelated to authorization: server errors, exceeding quota, bad requests, and so on.
			throw error;
		}
	},

	/**
	 * Check if a sync is needed and show alert if so
	 */
	maybeShowSyncNeededAlert: async function (changed_data) {
		const saveState = get(dataSyncSaveState);
		if (saveState === DATA_SYNC_SAVE_STATE.ERROR) {
			// Don't override an error alert
			return;
		}
		const syncNeeded = await google_drive.isSyncNeeded(changed_data);
		if (syncNeeded) {
			dataSyncAlert(
				'There have been ' +
					syncNeeded +
					' changes made since the last sync. You may wish to <a href="/people">sync now</a>.'
			);
		}
	},

	/**
	 * If signed in, check sync and change dates, maybe alert
	 * - Listens for login state to change -> boolean passed
	 * - Listens for data data to change -> object passed
	 */
	isSyncNeeded: async function (changed_data) {
		// If we already know sync is needed, no need to check again
		// until after a sync is done
		if (google_drive.syncNeeded) {
			return google_drive.syncNeeded;
		}

		// Default false - no sync needed
		google_drive.syncNeeded = false;

		// Whether signed into Google Drive
		const is_signed_in =
			typeof changed_data == 'boolean' ? changed_data : get(dataSyncIsSignedIn);

		// Local Data
		const syncable_data = util.isObject(changed_data) ? changed_data : get(dataSyncable);
		const local_updated_at = syncable_data.updated_at ?? 0;
		const local_synced_at = syncable_data.sync?.google_drive?.synced_at ?? 0;
		const local_updated_after_sync = local_updated_at > local_synced_at;

		// Remote sync data - (will return 0 if not signed in)
		const remote_updated_at = await google_drive.getRemoteUpdatedAt();

		// Debugging output
		/*
		console.log('isSyncNeeded - fresh check:', {
			is_signed_in,
			syncable_data,
			local_updated_at,
			local_synced_at,
			local_updated_after_sync,
			remote_updated_at
		});
		*/

		// If not currently signed in and never synced before, don't show any warnings
		// - wait for them to log in before we let them know sync is needed
		if (!is_signed_in && !local_synced_at) {
			return google_drive.syncNeeded;
		}

		const syncNeeded = [];
		if (local_updated_after_sync) {
			syncNeeded.push('local');
		}
		if (remote_updated_at > local_synced_at) {
			syncNeeded.push('remote');
		}
		google_drive.syncNeeded = syncNeeded.join(' & ');

		return google_drive.syncNeeded;
	},

	/**
	 * Get Remote updated date
	 * - Only fetch once and cache in property to avoid extra calls
	 * - Used to determine whether sync might be needed
	 */
	getRemoteUpdatedAt: async function () {
		let remote_updated_at = 0;

		const signed_in = get(dataSyncIsSignedIn);
		if (!signed_in) {
			return 0;
		}

		const drive_data = await google_drive.readData();

		if (util.isObject(drive_data) && 'updated_at' in drive_data) {
			// Note: we only cache if we got a value
			// - otherwise, we should try again on the next call
			remote_updated_at = drive_data.updated_at;
		}

		return remote_updated_at;
	},

	// Sync syncableData with GoogleDrive
	sync: async function () {
		const local_data = get(dataSyncable);
		const synced_data = await google_drive._sync(local_data);
		dataSyncable.setWithoutTimestampChange(synced_data);
	},

	/**
	 * Sync Google Drive syncable data with passed data param
	 *  - Save merged data
	 *  - Return merged data
	 */
	_sync: async function (local_data) {
		if (!get(dataSyncIsSignedIn)) {
			dataSyncAlert(
				'<a href="/people">Sign in to your Google Drive account</a> to back up and sync your data.',
				'warning'
			);
			dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.PENDING_LOGIN);
			return local_data;
		}

		dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.SAVING);
		dataSyncAlert('Syncing data to Google Drive...');

		let successful = false;
		let local_data_changed = false;
		let remote_data_changed = false;

		// Note data before sync
		const drive_data = await google_drive.readData();
		const local_data_before = util.objectClone(local_data);

		console.log({ drive_data, local_data_before });

		// Make note of sync time before starting
		const local_synced_at = local_data.sync?.google_drive?.synced_at ?? 0;

		// Attempt to read in remote data file
		if (util.isObject(drive_data)) {
			dataSyncAlert('Existing remote data found - reading & syncing...');
			local_data = syncData(local_data, drive_data);
			local_data_changed = didSyncResultInChange(local_data, local_data_before);
			remote_data_changed = didSyncResultInChange(local_data, drive_data);
			successful = true;
		} else if (drive_data === false) {
			dataSyncAlert('No existing remote data file found - it will be created');
			successful = true;
		} else {
			dataSyncAlert('CS506 - Remote data file found, but failed to read it', 'error');
		}

		// Set new sync time assuming success
		local_data.sync.google_drive.synced_at = util.timestamp();

		// Set updated date to match synced date if data changed significantly from prior *remote*
		// - Set here so that it syncs to remote data
		// - See below for check if local data changed
		if (remote_data_changed) {
			local_data.updated_at = local_data?.sync?.google_drive?.synced_at ?? 0;
		}

		// Write the synced data to Google Drive
		// - as long as we've been successful so far
		if (successful) {
			successful = false;
			dataSyncAlert('Writing to Google Drive...');
			const file_id = await google_drive.writeData(
				local_data,
				local_data?.sync?.google_drive?.file_id ?? 0
			);
			if (file_id !== 0) {
				successful = true;
				local_data.sync.google_drive.file_id = file_id;
			}
		}

		// Set local updated date to match synced date if data changed significantly from prior *remote*
		// - Set here so it *doesn't* sync to remote data
		// - See above for check if remote data changed
		if (local_data_changed) {
			local_data.updated_at = local_data?.sync?.google_drive?.synced_at ?? 0;
		}

		// As long as everything has worked out so far...
		// - If there were issues along the way, errors or warnings would already be showing
		if (successful) {
			// Show success, wait a bit, then show pending again
			dataSyncAlert('Sync Successful!', 'success');
			dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.SUCCESS);
		} else {
			local_data.sync.google_drive.synced_at = local_synced_at;
		}

		window.setTimeout(function () {
			dataSyncMessageShow.set(false);
			dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.PENDING);
		}, 2000);

		return local_data;
	},

	/**
	 * Read data file contents from Google Drive
	 *  - Return file contents
	 */
	readData: async function () {
		// Try and read the data file
		return await google_drive._readData().catch(error => {
			// If token expired or was invalidated, try getting a fresh one
			return (
				google_drive
					.getToken(error)
					// Then try again to read data
					.then(google_drive._readData)
					.catch(function (error) {
						console.error(error);
						dataSyncAlert('CS504 - ' + JSON.stringify(error), 'error');
					})
			);
		});
	},

	_readData: async function () {
		const data_file_id = await google_drive.findData();
		if (data_file_id === 0) {
			return false;
		}

		return google_drive.gapi.client
			.request({
				path:
					'https://www.googleapis.com/drive/v3/files/' +
					encodeURIComponent(data_file_id) +
					'?alt=media',
				method: 'GET'
			})
			.then(google_drive._processReadData);
	},

	_processReadData: async function (response) {
		return response.result ?? null;
	},

	/**
	 * Write data file contents to Google Drive
	 *  - Return ID of file
	 */
	writeData: async function (data, file_id = 0) {
		const jsonData = JSON.stringify(data);
		const metadata = {
			name: 'data.json',
			mimeType: 'application/json'
		};

		if (!file_id) {
			metadata.parents = ['appDataFolder'];
		}

		const multipart = new MultiPartBuilder()
			.append('application/json', JSON.stringify(metadata))
			.append(metadata.mimeType, jsonData)
			.finish();

		await google_drive.gapi.client
			.request({
				path:
					'https://content.googleapis.com/upload/drive/v3/files/' +
					(file_id ? encodeURIComponent(file_id) : '') +
					'?uploadType=multipart&fields=id',
				method: file_id ? 'PATCH' : 'POST',
				params: {
					uploadType: 'multipart',
					supportsTeamDrives: true,
					fields: 'id'
				},
				headers: { 'Content-Type': multipart.type },
				body: multipart.body
			})
			.then(response => {
				file_id = response.result.id;
				dataSyncAlert('Data saved successfully (ID ' + file_id + ')');
			})
			.catch(error => {
				dataSyncAlert('CS505 - ' + JSON.stringify(error), 'error');
			});

		return file_id;
	},

	/**
	 * Find data file in Google Drive if it exists
	 *  - Return file id if exists, otherwise 0
	 */
	findData: async function () {
		// See if we already have the ID stored on this object
		let data_file_id = google_drive.dataFileId;
		if (data_file_id !== 0) {
			console.info(`Data file ID already found this session: ${data_file_id}`)
			return data_file_id;
		}

		// See if we have the ID in local data
		const local_data = get(dataSyncable);
		data_file_id = local_data?.sync?.google_drive?.file_id ?? 0;
		if (data_file_id !== 0) {
			console.info(`Data file ID found in local storage: ${data_file_id}`)
			google_drive.dataFileId = data_file_id;
			return data_file_id;
		}

		// Try and find the data file
		await google_drive._findData().catch(error => {

			console.warn('Error while trying to find data file:', error);

			// If token expired or was invalidated, try getting a fresh one
			google_drive
				.getToken(error)
				// Then try again to find data
				.then(google_drive._findData)
				.catch(function () {
					dataSyncAlert(
						'CS507 - No remote data - sync to create it.'
					);
				});
		});
		console.info(`Data file attempted to be found remotely - result: ${google_drive.dataFileId}`);

		// Save found data to local storage
		local_data.sync.google_drive.file_id = google_drive.dataFileId;
		dataSyncable.updateWithoutTimestampChange(function (ds) {
			ds.sync.google_drive.file_id = google_drive.dataFileId;
			console.log(' - Should be updating dataSyncable.sync to ', ds.sync);
			return ds;
		});

		// Return the file ID (or 0 if not found)
		// - will be set by _processFindData
		return google_drive.dataFileId;
	},

	_findData: async function () {
		if ( ! (google_drive?.gapi?.client?.drive?.files) ) {
			console.warn('Tried to find data, but gapi client not yet ready');
			return;
		}

		return google_drive.gapi.client.drive.files
			.list({
				spaces: 'appDataFolder',
				q: 'name="data.json"',
				fields: 'nextPageToken,files(*)',
				pageSize: 10
			})
			.then(google_drive._processFindData);
	},

	_processFindData: function (response) {
		if (response.result.files && response.result.files.length > 0) {
			if (response.result.files.length > 1) {
				dataSyncAlert(
					'CS502 - Multiple data files found - will use the first one',
					'warning'
				);
			}

			google_drive.dataFileId = response.result.files[0].id;
		}
	}
};
