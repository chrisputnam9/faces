<?php

// Import JSON
$people_data = json_decode(file_get_contents(__DIR__ . '/people.json'), true);
$people_new = json_decode(file_get_contents(__DIR__ . '/people-new.json'), true);

$people_existing = array_values($people_data['people']);
$people_id_autoincrement = $people_data['_autoincrement_id'];

// Build hash maps of existing people and new people by slug
$people_existing_by_slug = [];
foreach ($people_existing as $person) {
    $slug = get_slug($person);
    $people_existing_by_slug[$slug] = $person;
}
$people_new_by_slug = [];
foreach ($people_new as $person) {
    $slug = get_slug($person);
    $people_new_by_slug[$slug] = $person;
}

$processed_keyed_people = [];

// Loop through existing people
foreach ($people_existing as $person) {
    $slug = get_slug($person);
    // - if person exists in new data, add new data into existing data
    if (isset($people_new_by_slug[$slug])) {
        $new_person = $people_new_by_slug[$slug];
        $new_person['id'] = $person['id'];
        $processed_keyed_people[$person['id']] = merge_person($person, $new_person);
    } else {
        // - if person does not exist in new data, we'll drop them
        // - eg. just don't add them to processed keyed people
    }
    // - either way, remove them from new data so we know who's left
    unset($people_new_by_slug[$slug]);
}

// Loop through remaining new data (truly new people)
foreach ($people_new_by_slug as $person) {
    // - create a key/id for them
    $slug = get_slug($person);
    $id = ++$people_id_autoincrement . '-' . $slug;
    $person['id'] = $id;
    // - add them to existing data
    $processed_keyed_people[$id] = $person;
}

// Write keyed_people back to json
$new_data = [
    'people' => $processed_keyed_people,
    '_autoincrement_id' => $people_id_autoincrement,
];
file_put_contents(__DIR__ . '/people.json', json_encode($new_data, JSON_PRETTY_PRINT));

function get_slug($person)
{
    $name_or_email = $person['name'] ?: $person['email'];
    return preg_replace('/[^a-z]+/', '-', strtolower($name_or_email));
}

function merge_person($person, $new_person)
{
    // Merge new data into existing data
    $merged_person = $person;
    foreach ($new_person as $key => $new_value) {
        $old_value = $person[$key] ?? false;
        if (in_array($key, ['images'])) {
            $new_value = array_unique(array_merge($old_value, $new_value));
        }

        $merged_person[$key] = $new_value;
    }

    // Ensure that the id is the same as the existing person
    $merged_person['id'] = $person['id'];

    return $merged_person;
}
