/**
 * Utility functions that can only be used in the frontend / client / browser
 */

export const utilsFrontend = {

	downloadFile: (filename: string, content: string, mime: string, charset: string = 'utf-8') => {
		const content_string = `data:${mime};charset=${charset},` + content;
		const encoded_uri = encodeURI(content_string);
		const link = document.createElement('a');
		link.setAttribute('href', encoded_uri);
		link.setAttribute('download', filename);
		document.body.appendChild(link); // Required for Firefox
		link.click();
	}

}
