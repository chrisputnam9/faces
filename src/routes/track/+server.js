/**
 * Tracking Route
 * TODO Temporary until we can start syncing with GDrive
 */

import { json } from '@sveltejs/kit';
import fs from 'fs';

// TODO No authentication because we will never publish this
// TODO Instead we will sync to drive in the public version
export async function POST({ request }) {
	console.log('POST /track', request);
	const { person, stateGuess } = await request.json();
	console.log({
		person,
		stateGuess
	});
	// https://nodejs.org/en/learn/manipulating-files/writing-files-with-nodejs
	// TODO TODO
}
