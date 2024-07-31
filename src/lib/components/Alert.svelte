<script>
	export let type, message;
</script>

<div class="alert {type}" role="contentinfo">
	<!-- Trusted messages from app -->
	<!-- eslint-disable svelte/no-at-html-tags -->
	<p>{@html message}</p>
</div>

<style>
	.alert {
		position: fixed;
		bottom: 0;
		right: 0;
		box-sizing: border-box;
		padding: 0 10px;
		border-radius: 5px 0 0 0;
	}
</style>
