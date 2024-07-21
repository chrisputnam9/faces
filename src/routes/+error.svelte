<script lang="ts">
	import { page } from '$app/stores';
</script>

<section>
	<div class="container">
		<div class="content">
			<h1>Something Went Wrong</h1>
			{#if $page.status === 404}
				<p>That page was not found.</p>
			{:else}
				<p>{$page.status}: {$page.error.message}</p>
			{/if}
		</div>
	</div>
</section>

<style>
	section {
		width: 100%;
		display: flex;
		justify-content: start;
		align-items: center;
		padding: 0;
		align-items: start;
		gap: 20px;
	}
	.container {
		background-color: #eee;
		padding: 10px;
		border-radius: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>
