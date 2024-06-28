/**
 * CSV Tools
 */

import Papa from 'papaparse';
import { dataInterface } from '$lib/data';

export const csvInterface = {

	export: function (people) {
		const errors = [];
		const people_prepared = [];
		for (const person of people) {
			const person_prepared = {};
			for (const key in person) {
				// By convention __ prefixed keys are not part of the actual 'data'
				if (key.substr(0, 2) === '__') continue;
				const value = person[key];
				const type = typeof value;
				let value_prepared = value;
				if (value === null) {
					value_prepared = '';
				} else if (Array.isArray(value)) {
					// If it's an array of Objects - change each Object to JSON
					if (typeof value[0] === 'object') {
						value_prepared = JSON.stringify(value);
					}
					// Otherwise, good to go - leave it as-is and parser will take care of it
				} else if (['number', 'string', 'boolean'].includes(type)) {
					// Good to go - leave it as-is and parser will take care of it
				} else {
					errors.push('Unexpected value type for key:"' + key + '" of person:' + person.id);
				}
				person_prepared[key] = value_prepared;
			}
			people_prepared.push(person_prepared);
		}
		if (errors.length > 0) {
			alert('Error 101: Issues with data need to be resolved - see console');
			throw new Error('Issues with data need to be resolved:\n - ' + errors.join('\n - '));
		}

		// Generate and return the CSV contents
		return Papa.unparse(people_prepared);
	},

	import: function (file) {
		if (file.type !== 'text/csv') {
			alert('Unexpected Error 103: Only CSV files are supported by import at this time.');
			throw new Error('Unexpected file type: ', file);
		}

		const errors = [];
		const warnings = [];
		const regex_json = /^\[.*\]$/i;

		const data = Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			encoding: 'utf-8',
			worker: false,

			transform: function (value, header) {
				value = value.trim();

				// Convert comma separated strings to arrays
				if (['aliases', 'companies', 'emails', 'phones', 'images'].includes(header)) {
					value = value.split(',').filter((v) => v.trim() !== '');
				}

				// Convert JSON strings
				if (['facts', 'links'].includes(header)) {
					let error = false;
					let parsed_value = '';

					if (!value.match(regex_json)) error = 'Does not look like JSON array';

					if (!error) {
						try {
							parsed_value = JSON.parse(value);
						} catch (e) {
							error = 'Failed to parse JSON';
						}
					}

					if (!error) {
						if (!Array.isArray(parsed_value)) error = 'Parsed result was not an array';
					}

					if (!error) {
						return parsed_value;
					}

					errors.push(`Unexpected value for ${header} (${error}): ${value}`);

					return value;
				}

				return value;
			},

			complete: function (results, file) {

				if (results?.data?.length < 1) {
					errors.push('No data was read from file. The file may be empty or other errors prevented reading data.');
				}

				// Warnings - see https://www.papaparse.com/docs#errors
				// TODO - Test this
				if (results?.errors?.length > 0) {
					for (const error of results.errors) {
						warnings.push(`Parsing error ${error.code} at row ${error.row}: ${error.message}`);
					}
				}

				if (errors.length > 0) {
					alert('Error 105: Issues with some CSV data need to be resolved - see console');

					if (warnings.length > 0) {
						console.warn('CSV Data Warnings:\n - ', warnings.join('\n - '));
					}

					throw new Error(
						'Issues with some CSV data need to be resolved:\n - ' + errors.join('\n - ')
					);
				}

				if (warnings.length > 0) {
					alert('Warning: Although data was imported, there were some issues that might have caused unexpected results; review your CSV file carefully or see console for more details.');
					console.warn('CSV Data Warnings:\n - ', warnings.join('\n - '));
				}

				const new_people_raw = results.data;

				const new_people_merged = dataInterface.importMerge(new_people_raw);

				const counts = dataInterface.importCompare(new_people_merged);

				console.log('Import processing complete');
				console.log(counts);

				// TODO
				// alert('Successfully imported ' + results.data.length + ' people from CSV file.');

				/*
				// Test
				console.log('Success!');
				console.log(results);
				const imported_string = JSON.stringify(results.data[0]);
				console.log(imported_string);

				const temp_compare = structuredClone(all_people[0]);
				delete temp_compare.__json;
				const existing_string = JSON.stringify(temp_compare);
				console.log(existing_string);

				if (imported_string === existing_string) {
					console.log('SUCCESS!');
				} else {
					throw new Error('Imported data does not match existing data');
				}
				*/
			},

			error: function (error, file) {
				alert('Error 104: There was an issue parsing the CSV file.');
				console.error('Error parsing CSV file: ', error);
			}
		});
	},

};
