import { data } from '$lib/data';
export async function load() {
	const people = await data.loadPeople();
	const people = await data.loadTracking();
	return {
		people,
		tracking
	};
}
