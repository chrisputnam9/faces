<script>
	export let data;
</script>

<ul>
	{#each data.people as person}
		<li>
			<b>{person.name}</b>
			<br />
			{#each person.photos as photo}
				<img src={photo} alt={person.name} style="width: 100px;" />
			{/each}
		</li>
	{/each}
</ul>
