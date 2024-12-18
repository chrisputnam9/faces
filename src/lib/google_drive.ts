import { get } from 'svelte/store';
import { syncData, didSyncResultInChange } from './sync_logic';
import { util } from './util';
import { createLocalStore } from '$lib/stores';
import {
	DATA_SYNC_SAVE_STATE,
	dataSyncAlert,
	dataSyncIsAvailableForSignIn,
	dataSyncIsSignedIn,
	dataSyncSaveState,
	dataSyncLoading,
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
	isSyncing: false,
	isLoggingIn: false,

	emailLocalStore: null,
	tokenLocalStore: null,
	tokenExpiresLocalStore: null,

	initLocalStoresRan: false,
	initLocalStores: async function () {
		if (this.initLocalStoresRan) return;
		this.initLocalStoresRan = true;

		google_drive.emailLocalStore = createLocalStore('google_drive_user_login_email', '');
		google_drive.tokenLocalStore = createLocalStore('google_drive_gapi_client_token', '');
		google_drive.tokenExpiresLocalStore = createLocalStore('google_drive_gapi_client_token_expires', '');

		const sync = createLocalStore('sync', {
			google_drive: {
				synced_at: 0,
				file_id: 0,
			}
		});
		dataSyncable.syncWith(sync, 'sync');
	},

	/**
	 * Initialize GAPI and GIS
	 * - Run by the Data Interface's init
	 * - So, it will init as soon as people are loaded on any page
	 */
	initRan: false,
	init: async function () {
		if (this.initRan) return;
		this.initRan = true;

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

		google_drive.initTokenCheck();

		// Listen for sign in or data change and check for possible sync needed
		// - Needs to happen after Google SDK is fully loaded
		dataSyncIsSignedIn.subscribe(google_drive.maybeSync);
		dataSyncable.subscribe(google_drive.maybeSync);

	},

	initTokenCheck: async function () {
		// See if we have a token saved in local storage already
		try {
			const token = await get(google_drive.tokenLocalStore);
			if (!token) throw new Error('No Google account token saved in local storage');

			// See if the token has expired
			// - if so, we'll try to get a new one right away
			// - as opposed to waiting for a failed request
			const token_expires = await get(google_drive.tokenExpiresLocalStore);
			if (token_expires !== '') {
				if (Math.ceil(Date.now() / 1000) > parseInt(token_expires)) {
					console.warn(
						'The Google account token in local storage has expired - attempting to get a new one'
					);
					await google_drive.getToken();
				}
			}

			google_drive.gapi.client.setToken(token);
			dataSyncIsSignedIn.set(true);
			dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.PENDING_SYNC);
			return;
		} catch (error) {
			console.warn('NOT logged in due to invalid local Google account token\n', error);
		}

		// If we don't have a token saved, or it's expired, we're not logged in
		dataSyncIsAvailableForSignIn.set(true);
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
			google_drive.isLoggingIn = true;
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
								reject('Google login canceled by closing popup. Refresh and try again.');
								break;
							case 'popup_failed_to_open':
								reject(
									'Google account connection failed because popup window did not open.<br>Check browser settings for popups on this site, then refresh.'
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
					dataSyncLoading.set(false);
				}
			}).catch(error => {
				dataSyncAlert(error, 'error');
			});
			google_drive.isLoggingIn = false;
		} else {
			// Errors unrelated to authorization: server errors, exceeding quota, bad requests, and so on.
			throw error;
		}
	},

	/**
	 * Check if a sync is needed and show alert if so
	 */
	maybeSync: async function (changed_data) {

		// Don't sync if already syncing or logging in
		if (google_drive.isSyncing || google_drive.isLoggingIn) {
			return;
		}

		const saveState = get(dataSyncSaveState);
		if (saveState === DATA_SYNC_SAVE_STATE.ERROR) {
			// Don't override an error alert
			return;
		}
		const syncNeeded = await google_drive.isSyncNeeded(changed_data);
		if (google_drive.isSyncing) {
			console.info('Already Syncing');
			return;
		} else if (! get(dataSyncIsSignedIn)) {
			return;
		} else if (! syncNeeded) {
			dataSyncAlert('No sync needed - all up-to-date', 'success');
			dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.SUCCESS);

			window.setTimeout(function () {
				dataSyncMessageShow.set(false);
				dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.PENDING_SYNC);
			}, 2000);
			return;
		}

		google_drive.isSyncing = true;
		dataSyncAlert(
			'There have been ' +
				syncNeeded +
				' changes made since the last sync. Will sync now...'
		);
		// Autosync
		google_drive.sync();
	},

	/**
	 * If signed in, check sync and change dates, maybe alert
	 * - Listens for login state to change -> boolean passed
	 * - Listens for data data to change -> object passed
	 */
	isSyncNeeded: async function (changed_data) {
		// If we already know sync is needed, no need to check again
		// until after a sync is done
		if (google_drive.syncNeeded || google_drive.isSyncing) {
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
		const local_synced_at = syncable_data.data.sync?.google_drive?.synced_at ?? 0;
		const local_updated_after_sync = local_updated_at > local_synced_at;

		// Remote sync data - (will return 0 if not signed in)
		const remote_updated_at = await google_drive.getRemoteUpdatedAt();
		const remote_updated_after_sync = remote_updated_at > local_synced_at;

		// Debugging output
		console.log('isSyncNeeded - fresh check:', {
			is_signed_in,
			syncable_data,
			local_updated_at,
			local_synced_at,
			remote_updated_at,
			local_updated_after_sync,
			remote_updated_after_sync,
		});

		// If not currently signed in - wait for them to log in before we let them know sync is needed
		if (!is_signed_in) {
			// Show a message if they ever synced before - so they know they're logged out
			if (local_synced_at) {
				dataSyncAlert('Log in on manage page to keep data synced to Google Drive.');
			}
			dataSyncLoading.set(false);
			return google_drive.syncNeeded;
		}

		const syncNeeded = [];
		if (local_updated_after_sync) {
			syncNeeded.push('local');
		}
		if (remote_updated_after_sync) {
			syncNeeded.push('remote');
		}

		/*
		 * Loading can be considered complete if either
		 *  - No sync needed
		 *  - Or only local changes (one-way saving to remote)
		 */
		if (
			syncNeeded.length === 0
			|| (syncNeeded.length === 1 && syncNeeded[0] === 'local')
		) {
			dataSyncLoading.set(false);
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
		google_drive.isSyncing = true;
		const local_data = get(dataSyncable);
		const synced_data = await google_drive._sync(local_data);
		// Update local data only if remote changes were detected
		if (typeof google_drive.syncNeeded === 'string' && google_drive.syncNeeded.includes('remote')) {
			// false to avoid updating timestamp (and another sync)
			await dataSyncable.set(synced_data, false);
		}
		google_drive.syncNeeded = false;
		google_drive.isSyncing = false;
	},

	/**
	 * Sync Google Drive syncable data with passed data param
	 *  - Save merged data
	 *  - Return merged data
	 */
	_sync: async function (local_data) {
		if (!get(dataSyncIsSignedIn)) {
			dataSyncAlert(
				'Log in on manage page to keep data synced to Google Drive.',
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
		let merged_data = util.objectClone(local_data);

		// Attempt to read in remote data file
		if (util.isObject(drive_data)) {
			dataSyncAlert('Existing remote data found - reading & syncing...');
			merged_data = syncData(local_data, drive_data);
			local_data_changed = didSyncResultInChange(merged_data, local_data_before);
			remote_data_changed = didSyncResultInChange(merged_data, drive_data);
			successful = true;
		} else if (drive_data === false) {
			dataSyncAlert('No existing remote data file found - it will be created');
			successful = true;
		} else {
			dataSyncAlert('CS506 - Remote data file found, but failed to read it', 'error');
		}

		// Mark the time of sync and assume success (will revert later if it fails)
		const synced_at = util.timestamp();
		merged_data.data.sync.google_drive.synced_at = synced_at;

		// Set updated date to match synced date if data changed significantly from prior *remote*
		// - Set here so that it syncs to remote dat
		// - See below for check if local data changed
		if (remote_data_changed) {
			// Mark that the merged data changed at time of sync
			merged_data.updated_at = synced_at;
		}

		// Write the synced data to Google Drive
		// - as long as we've been successful so far
		// - and if there were local changes
		if (successful) {
			successful = false;
			dataSyncAlert('Writing to Google Drive...');
			const file_id = await google_drive.writeData(merged_data);
			if (file_id !== 0) {
				successful = true;
				merged_data.data.sync.google_drive.file_id = file_id;
			}
		}

		// Set local updated date to match synced date if data changed significantly from prior *remote*
		// - Set here so it *doesn't* sync to remote data
		// - See above for check if remote data changed
		if (local_data_changed) {
			// Mark that local data changed at time of sync
			merged_data.updated_at = merged_data?.data?.sync?.google_drive?.synced_at ?? 0;
		}

		// As long as everything has worked out so far...
		// - If there were issues along the way, errors or warnings would already be showing
		if (successful) {
			// Show success, wait a bit, then show pending again
			dataSyncAlert('Sync Successful!', 'success');
			dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.SUCCESS);
			// Loading considered complete; we've synced
			dataSyncLoading.set(false);
		} else {
			merged_data.data.sync.google_drive.synced_at = local_data_before.sync?.google_drive?.synced_at ?? 0;
		}

		window.setTimeout(function () {
			dataSyncMessageShow.set(false);
			dataSyncSaveState.set(DATA_SYNC_SAVE_STATE.PENDING_SYNC);
		}, 2000);

		return merged_data;
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
	writeData: async function (data) {
		let file_id = data?.data?.sync?.google_drive?.file_id ?? 0;
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
				console.error(error);
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
			return data_file_id;
		}

		// See if we have the ID in local data
		const local_data = get(dataSyncable);
		data_file_id = local_data?.data?.sync?.google_drive?.file_id ?? 0;
		if (data_file_id !== 0) {
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
						'CS507 - No remote data yet - sync to create it.'
					);
				});
		});

		// Save found data to local storage
		local_data.data.sync.google_drive.file_id = google_drive.dataFileId;
		dataSyncable.update(function (ds) {
			ds.data.sync.google_drive.file_id = google_drive.dataFileId;
			return ds;
		}, false); // false to avoid updating timestamp

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
