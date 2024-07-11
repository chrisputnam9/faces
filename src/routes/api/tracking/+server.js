/**
 * Tracking Route
 * TODO Temporary until we can start syncing with GDrive
 */

// TODO No authentication because we will never publish this
// TODO Instead we will sync to drive in the public version

import { json } from '@sveltejs/kit';
import fs from 'fs';

export async function GET() {
	let return_data = {
		tracking: {}
	};
	try {
		const data = await fs.promises.readFile('data/tracking.json', 'utf8');
		return_data = JSON.parse(data);
	} catch (e) {
		// Ignore error, just return empty data
	}
	return json(return_data);
}

export async function POST({ request }) {
	const data = await request.json();

	await fs.promises.writeFile('data/tracking.json', JSON.stringify(data, null, 2));

	return json({ data, success: true, error: false });
}
