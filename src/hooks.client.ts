import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

console.log('hooks.client');

Sentry.init({
	dsn: 'https://e5cd2a60d78fb2355c5007fd26ce76a3@o4509315849519104.ingest.us.sentry.io/4509474468397056',

	tracesSampleRate: .1
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
