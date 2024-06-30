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
					value = value.split(',')
						.map(v => v.trim())
						.filter(v => v !== '');
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

			complete: async function (results, file) {

				if (results?.data?.length < 1) {
					errors.push('No data was read from file. The file may be empty or other errors prevented reading data.');
				}

				// Warnings - see https://www.papaparse.com/docs#errors
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

				const {data_merged, stats} = await dataInterface.importMerge(new_people_raw);

				console.groupCollapsed(`Import data merge results`);
				console.log({data_merged, stats});
				console.groupEnd();

				const total_change_count = stats.create.count + stats.update.count + stats.delete.count;

				if (total_change_count < 1) {
					alert('No changes found in CSV compared to existing data.');
					return;
				}

				const explain = dataInterface.explainImportStats(stats);

				let message_confirm = 'Do you want to continue with import?';
				for (const key in explain) {
					if (stats[key].count < 1) continue;
					message_confirm += `\n - ${explain[key].summary}`;
					console.groupCollapsed(`Import details: '${key}' (${stats[key].count})`);
					console.log(' - ' + explain[key].details.join('\n - '));
					console.groupEnd();
				}

				const total_old_plus_new = total_change_count + stats.same.count;
				const total_change_percentage = total_old_plus_new > 0 ? Math.round((total_change_count / total_old_plus_new) * 10000, 2)/100 : 0;
				message_confirm += '\n';
				if (total_change_percentage > 50) {
					message_confirm += `\nWARNING - REVIEW CLOSELY. This is a large change. `;
				}
				message_confirm += `\nTotal changes: ${total_change_count} of ${total_old_plus_new} (${total_change_percentage}%)`;
				message_confirm += `\n\nCompare with export or view details in console if needed.`;

				const continue_import = confirm(
					message_confirm
				);

				if ( ! continue_import) {
					console.log('Import cancelled by user');
					return;
				}

				dataInterface.saveRawPeople(data_merged);
				console.log('Import complete! Refresh page to see new data.');
			},

			error: function (error, file) {
				alert('Error 104: There was an issue parsing the CSV file.');
				console.error('Error parsing CSV file: ', error);
			}
		});
	},

};
