<div class="background">
	<nav>
		<a href="/">Quiz</a> | <a href="/metrics">Metrics</a> | <a href="/people">Manage People</a>
	</nav>

	<slot />
</div>

<style>
	.background {
		background-color: #111;
		height: 100%;
		display: flex;
		padding: 20px;
		align-items: start;
		flex-direction: column;
		gap: 20px;
	}

	nav {
		background-color: #eee;
		padding: 10px;
		border-radius: 10px;
	}
</style>
