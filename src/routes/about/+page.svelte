<script lang="ts">
	import { onMount } from 'svelte';
	import { dataSyncLoading } from '$lib/stores/data_stores';

	onMount(() => {
		dataSyncLoading.set(false);
	});
</script>

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

		<p>
			On the Manage People page or while quizzing, you can add new images by URL (the image must be
			hosted elsewhere). You can re-add an existing image to push it to the front - eg. make it the
			first image you see while quizzing.
		</p>

		<p><a href="/">Faces App</a> | <a href="/terms-privacy">Terms & Privacy Policy</a></p>

		<h2>Helpful Resources</h2>

		<p>
			<a href="https://artofmemory.com/wiki/Memorizing_Names_and_Faces/" target="_blank"
				>Memorizing Names and Faces - Art of Memory</a
			>
		</p>

		<p>
			<a
				href="https://duolingo.fandom.com/wiki/Guide_to_keyboard_layouts_and_input_methods"
				target="_blank">Entering Special Characters - Duolingo</a
			>
		</p>

		<h2>Support</h2>

		<p>
			For support, feedback, or feature requests, submit an issue
			<a href="https://github.com/chrisputnam9/faces/issues" target="_blank">here</a>
		</p>

		<p>Join others in supporting open source development:</p>

		<ul>
			<li><a href="https://ko-fi.com/chrisputnam9" target="_blank">Ko-fi</a></li>
			<li><a href="https://github.com/sponsors/chrisputnam9" target="_blank">Github Sponser</a></li>
		</ul>
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
