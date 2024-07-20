<div class="background">
	<nav data-sveltekit-reload>
		<a href="/">Quiz</a> | <a href="/metrics">Metrics</a> | <a href="/people">Manage People</a>
	</nav>

	<slot />
</div>

<style>
	.background {
		display: flex;
		padding: 20px;
		align-items: start;
		gap: 20px;
		flex-wrap: wrap;
	}

	nav {
		background-color: #eee;
		padding: 10px;
		border-radius: 10px;
	}
</style>
