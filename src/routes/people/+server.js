/**
 * People Route
 * Temporary until we can start syncing with GDrive
 */

import { json } from '@sveltejs/kit';
import fs from 'fs';

export async function GET() {
	const people = await fs.promises.readFile('data/people.json', 'utf8');
	return json(JSON.parse(people));
}
