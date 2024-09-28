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
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
	}
	section {
		background-color: #fff;
		padding: 30px;
		border-radius: 10px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}
	h1 {
		color: #333;
		margin-bottom: 20px;
	}
	p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 15px;
	}
	a {
		color: #0066cc;
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
</style>
