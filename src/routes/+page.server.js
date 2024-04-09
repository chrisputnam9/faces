import { data } from '$lib/data';
export async function load() {
	return await data.loadPeople();
}
