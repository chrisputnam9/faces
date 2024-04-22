/**
 * Tracking Route
 * TODO Temporary until we can start syncing with GDrive
 */

// TODO No authentication because we will never publish this
// TODO Instead we will sync to drive in the public version

import { json } from '@sveltejs/kit';
import fs from 'fs';

export async function GET() {
	const tracking = await fs.promises.readFile('data/tracking.json', 'utf8');
	return json(JSON.parse(tracking));
}

export async function POST({ request }) {
	const tracking = await request.json();

	console.log(tracking);

	// https://nodejs.org/en/learn/manipulating-files/writing-files-with-nodejs
	// TODO TODO write to file

	return json({ tracking, success: false, error: 'Not fully implemented' });
}
