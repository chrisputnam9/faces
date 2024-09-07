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
		display: block;
		width: auto;
		background-color: #eee;
		padding: 10px;
		border-radius: 10px;
	}

	.alert.info,
	.alert.information,
	.alert.informational {
		background: #8db5ff;
	}

	.alert.success {
		background: #99ff8d;
	}

	.alert.error {
		background: #ff8d8d;
	}

	.alert.warning,
	.alert.warn {
		background: #ffd18d;
	}
</style>
