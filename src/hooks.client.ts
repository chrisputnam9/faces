import { handleErrorWithSentry} from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,
	environment: import.meta.env.MODE,
	tracesSampleRate: 0.1,
	_experiments: { enableLogs: true },
	integrations: [
		Sentry.feedbackIntegration({
			colorScheme: 'dark',
			showBranding: false
		})
	]
	/*
	beforeSend(event) {
		// If exception, show report dialog
		if (event.exception && event.event_id) {
			Sentry.showReportDialog({ eventId: event.event_id });
		}
		return event;
	}
	*/
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
