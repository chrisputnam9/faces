/**
 * People Route
 * TODO Temporary until we can start syncing with GDrive
 */

// TODO No authentication because we will never publish this
// TODO Instead we will sync to drive in the public version

import { json } from '@sveltejs/kit';
import fs from 'fs';

export async function GET() {
	const people = await fs.promises.readFile('data/people.json', 'utf8');
	return json(JSON.parse(people));
}

export async function POST({ request }) {
	const data = await request.json();

	await fs.promises.writeFile('data/people.json', JSON.stringify(data, null, 2));

	return json({ data, success: true, error: false });
}
