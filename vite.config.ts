import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({mode}) => {

	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			sentrySvelteKit({
				sourceMapsUploadOptions: {
					org: 'chris-putnam',
					project: 'faces',
					authToken: env.SENTRY_AUTH_TOKEN
				}
			}),
			sveltekit()
		],
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}']
		}
	}
});
