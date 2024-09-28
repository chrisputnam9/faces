<svelte:head>
	<title>Faces - About</title>
	<meta name="description" content="Faces - manage your contacts and learn their names" />
</svelte:head>
<main>
	<section>
		<h1>Faces - About</h1>

		<p>Faces (faces.onl) helps you manage your contacts and learn their names.</p>

		<p>
			You can import contacts from a CSV. Go the Manage People page, export to a CSV, then fill in
			the people you want to add to the application. Import the CSV and you can get started
			reviewing, searching, and quizzing yourself on names.
		</p>

		<p>
			After doing some quizzing, you can view your progress on the Metrics page to see how you're
			doing at learning names.
		</p>

		<p><a href="/">Faces App</a></p>

		<p><a href="/terms-privacy">Terms & Privacy Policy</a></p>
	</section>
</main>

<style>
	main {
		width: 100vw;
		display: flex;
		gap: 20px;
		flex-wrap: nowrap;
	}
	section {
		width: auto;
		height: auto;
		background-color: #eee;
		padding: 10px;
		border-radius: 10px;
		display: flex;
		gap: 10px;
		padding: 20px;
		display: flex;
		min-width: 300px;
		width: 49%;
		height: calc(100vh - 170px);
		flex-direction: column;
	}
</style>
