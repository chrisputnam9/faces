<?php

// TODO - if running this again, do it in a way that merges new data into existing data instead

// Import people.json
$people = json_decode(file_get_contents(__DIR__ . '/people.json'), true);
$people = array_values($people);

// Process people and key by ID
//  - incremented number, followed by slug based on name or email
//  - e.g. 1-john-doe
$keyed_people = [];

foreach ($people as $p => $person) {
    $name_or_email = $person['name'] ?: $person['email'];
    $slug = preg_replace('/[^a-z]+/', '-', strtolower($name_or_email));
	$id = $p . '-' . $slug;
	$person['id'] = $id;
	$keyed_people[$id] = $person;
}

$new_data = [
	'people' => $keyed_people,
	'_autoincrement_id' => $p,
];

// Write keyed_people back to json
file_put_contents(__DIR__ . '/people.json', json_encode($new_data, JSON_PRETTY_PRINT));
