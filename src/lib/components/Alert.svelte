<script>
	import {
		dataSyncMessage,
		dataSyncMessageShow,
		dataSyncMessageType
	} from '$lib/stores/data_stores';

	let message = '&nbsp;';

	$: message = $dataSyncMessageShow ? $dataSyncMessage : '&nbsp;';
</script>

<span class="alert {$dataSyncMessageType}" role="contentinfo">
	<!-- Trusted messages from app -->
	<!-- eslint-disable svelte/no-at-html-tags -->
	{@html message}
</span>

<style>
	.alert.info,
	.alert.information,
	.alert.informational {
		color: #8db5ff;
	}

	.alert.success {
		color: #99ff8d;
	}

	.alert.error {
		color: #ff8d8d;
	}

	.alert.warning,
	.alert.warn {
		color: #ffd18d;
	}
</style>
