<script>
	export let type, message;
</script>

<nav class="alert {type}" role="contentinfo">
	<!-- Trusted messages from app -->
	<!-- eslint-disable svelte/no-at-html-tags -->
	{@html message}
</nav>

<style>
	.alert {
		display: inline;
		width: auto;
		float: right;
		text-align: right;
		opacity: 0.5;
	}

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
