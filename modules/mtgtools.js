const Scryfall = require('scryfall-client');
const Canvas = require('canvas');
const fs = require('fs').promises;
const fetch = require('node-fetch');
const FormData = require('form-data');
const { changeDpiDataUrl } = require('changedpi');
const { MessageAttachment } = require('discord.js');
const crypto = require('crypto');

/*

   ______                _   _
  |  ____|              | | (_)
  | |__ _   _ _ __   ___| |_ _  ___  _ __  ___
  |  __| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
  | |  | |_| | | | | (__| |_| | (_) | | | \__ \
  |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/


*/

/**
 * Works out the search type for a string to search scryfall from an input
 * @param {string} searchString The string being searched for
 * @returns {string} The scryfall Search Type
 */
function getIDType(searchString) {
	let returnType;
	// Work out what the user provided
	if (searchString.match(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/i)) {
		// Is a scryfall ID
		returnType = 'scryfall';
	} else if (searchString.match(/^\d{1,6}$/)) {
		// Some sort of other ID, Assume Multiverse ID
		returnType = 'multiverse';
	} else {
		// Assume Fuzzy Name
		returnType = 'fuzzyName';
	}
	return returnType;
}

/**
 * Uploads an image file to some hosting service
 * @param {Object} fileHostSettings Object containing the settings to be applied for the upload
 * @param {Buffer} imageBuffer A base64 buffer containing the image to upload
 * @param {string} fileName The name of the file being uploaded
 * @returns {string} The URL of the uploaded file
 */
async function uploadImage(fileHostSettings, imageBuffer, fileName = '') {
	try {
		// Create a form to use for the uploads
		let form = new FormData;
		for (const key in fileHostSettings.formParts) {
			if (!Object.hasOwnProperty.call(fileHostSettings.formParts, key)) continue;
			const value = fileHostSettings.formParts[key];
			form.append(key, value);
		}

		// Add any custom headers
		let headers = form.getHeaders();
		for (const key in fileHostSettings.headers) {
			if (!Object.hasOwnProperty.call(fileHostSettings.headers, key)) continue;
			const value = fileHostSettings.headers[key];
			headers.append(key, value);
		}

		// Perform the requested upload
		switch (fileHostSettings.method?.toLowerCase()) {
			case 'local': {
				// Save file to a local directory
				console.log('Saving Image to Local Directory');
				var id = crypto.randomBytes(20).toString('hex');
				await fs.writeFile(`${fileHostSettings.path}${id}\\${fileName}.png`, imageBuffer, 'base64');
				return `${fileHostSettings.URL}${id}/${fileName}.png`;
			}
			case 'jirafeau': {
				// Upload to a Jirafeau Instance
				console.log('Uploading Image to Jirafeau');
				form.append('file', imageBuffer, { filename: fileName, contentType: 'image/png' });
				let uploadResponse = await fetch(`${fileHostSettings.URL}script.php`, {
					method: 'POST',
					header: headers,
					timeout: 300000,
					body: form,
				});
				if (uploadResponse.ok) {
					console.log('Image Uploaded to Jirafeau');
					let upload = await uploadResponse.text();
					upload = upload.split('\n');
					if (upload[0].match(/Error.*/)) {
						throw new Error(`Jirafeau Error: ${upload[0]}`);
					} else {
						return `${fileHostSettings.URL}f.php?h=${upload[0]}&d=1`;
					}
				} else {
					throw new Error(`HTTP Error: [${uploadResponse.status}] ${uploadResponse.statusText}`);
				}
			}
			case 'imgur': {
				// Upload to a Imgur
				console.log('Uploading Image to Imgur');
				form.append('image', imageBuffer, { filename: fileName, contentType: 'image/png' });
				form.append('type', 'base64');
				let uploadResponse = await fetch(`https://api.imgur.com/3/upload`, {
					method: 'POST',
					header: headers,
					timeout: 300000,
					body: form,
				});
				if (uploadResponse.ok) {
					console.log('Image Uploaded to Imgur');
					let upload = await uploadResponse.json();
					return upload.data.link;
				} else {
					throw new Error(`HTTP Error: [${uploadResponse.status}] ${uploadResponse.statusText}`);
				}
			}
			default: {
				// Default to using goFile
				console.log('Uploading Image to GoFile');
				form.append('file', imageBuffer, { filename: fileName, contentType: 'image/png' });
				let getServerResponse = await fetch('https://api.gofile.io/getServer');
				if (getServerResponse.ok) {
					let getServer = await getServerResponse.json();
					let uploadResponse = await fetch(`https://${getServer.data.server}.gofile.io/uploadFile`, {
						method: 'POST',
						header: headers,
						timeout: 300000,
						body: form,
					});
					if (uploadResponse.ok) {
						console.log('Image Uploaded to GoFile');
						let upload = await uploadResponse.json();
						return upload.data.directLink;
					} else {
						throw new Error(`HTTP Error: [${uploadResponse.status}] ${uploadResponse.statusText}`);
					}
				} else {
					throw new Error(`HTTP Error: [${getServerResponse.status}] ${getServerResponse.statusText}`);
				}
			}
		}
	} catch (error) {
		throw new Error(error);
	}
}

/**
 * Load a template JSON file from a local directory or downloaded from a URL
 * @param {string} path The local path or URL of the template file
 * @returns {Object} The Parsed JSON Object
 */
async function loadTemplate(path) {
	return new Promise((resolve, reject) => {
		// Request the file (Max 1MB)
		fetch(path, { size: 1000000 })
			.then(res => {
				// Check the Response code
				if (res.ok) {
					// Expect JSON
					res.json();
				} else {
					throw new Error(`Failed to load resource Error: ${res.statusText}`);
				}
			})
			.then(json => {
				// JSON Response received
				resolve(json);
			})
			.catch(err => {
				// Error out
				reject(err);
			});
	});
}

/**
 * Build an image canvas using a template objet and a data object
 * @param {Object} template The Template Object
 * @param {Object} data The data to use while processing the template
 * @returns {Canvas} The completed canvas
 */
async function buildImage(template, data) {
	// Load Custom Fonts
	template.customFonts.forEach(font => {
		Canvas.registerFont(font.url, font);
	});

	// Create the base canvas
	let canvas = Canvas.createCanvas(template.width, template.height);
	let context = canvas.getContext('2d');

	// Draw each layer
	// Use a normal for loop here to get around async anonymous functions
	for (let index = template.layers.length - 1; index >= 0; index--) {
		const layer = template.layers[index];
		try {
			console.log(`Processing Layer: ${layer.description}`);
			if (testConditions(layer.conditions, data)) {
				await drawLayer(context, layer, data);
			}
		} catch (error) {
			console.error(`Failed to draw layer ${layer.description} - ${error.message}`);
		}
	}

	// Return the completed canvas
	return canvas;
}

/**
 * Inject properties from a data object into a layer based on its sepcifications
 * @param {Object} layer The layer object to inject properties into
 * @param {Object} data The object to pull properties from
 */
function substituteLayerProperties(layer, data) {
	// Substitute layer properties from data
	for (const layerProperty in layer.inputs) {
		if (!Object.prototype.hasOwnProperty.call(layer.inputs, layerProperty)) continue;
		const dataKey = layer.inputs[layerProperty];

		let currentData = data;
		let currentKey = dataKey;
		do {
			// Search deeper into object until either we find a string keyName or data is undefined
			if (typeof currentKey === 'string') {
				// Found the property
				if (currentData[currentKey] !== undefined) {
					// Set the layer property and exit the loop
					layer[layerProperty] = currentData[currentKey];
				}
				break;
			} else if (typeof currentKey === 'object') {
				// Move one level deeper, anything except first key is ignored
				currentKey = currentKey[currentKey.keys()[0]];
				currentData = currentData[currentKey.keys()[0]];
			}
		} while (currentKey !== undefined && currentData !== undefined);
	}
}

/**
 * Daw a layer onto a canvas context
 * @param {NodeCanvasRenderingContext2D} context The 2D context to draw the layer onto
 * @param {Object} layer The layer to be drawn
 * @param {Object} data The data to be injected into the layer and process conditions
 */
async function drawLayer(context, layer, data) {
	console.log(`Drawing Layer: ${layer.description}`);
	// Substitute Layer Properties from data
	substituteLayerProperties(layer, data);

	switch (layer.type) {
		case 'group': {
			// Create a new Canvas for the group
			let subCanvas = Canvas.createCanvas(layer.width, layer.height);
			let subContext = subCanvas.getContext('2d');
			// Draw the sublayers to the new canvas
			for (let index = 0; index < layer.layers.length; index++) {
				const subLayer = layer.layers[index];
				try {
					if (testConditions(subLayer.conditions, data)) {
						await drawLayer(subContext, subLayer, data);
					}
				} catch (error) {
					console.error(`Failed to draw layer ${subLayer.description} - ${error.message}`);
				}
			}
			// Draw the new canvas to the original canvas
			context.drawImage(subCanvas, layer.originX, layer.originY, layer.width, layer.height);
			break;
		}

		case 'text': {
			// Scale Text to size
			let scaledText = await scaleTextLayer(layer);
			// Draw the text to the canvas
			context.drawImage(scaledText, layer.originX, layer.originY, layer.width, layer.height);
			break;
		}

		case 'image': {
			// Scale Image to size
			let scaledImage = await scaleImageLayer(layer);
			// Draw the scaled image to the canvas
			context.drawImage(scaledImage, layer.originX, layer.originY, layer.width, layer.height);
			break;
		}

		case 'fill':
			// Draw a filled rectangle
			context.save();
			context.fillStyle = layer.fillStyle;
			context.fillRect(layer.originX, layer.originY, layer.width, layer.height);
			context.restore();
			break;

		case 'mask': {
			// Scale Image to size
			let maskImage = await scaleImageLayer(layer);
			// Draw the scaled image to the canvas for each operation
			layer.operations.forEach(operation => {
				context.save();
				context.globalCompositeOperation = operation;
				context.drawImage(maskImage, layer.originX, layer.originY, layer.width, layer.height);
				context.restore();
			});
			break;
		}

		default:
			console.error('Unknown Layer type');
			break;
	}
}

/**
 * Build a text layer object into a canvas
 * @param {Object} layer The text layer object to be created
 * @returns {Canvas} The completed layer image as a canvas
 */
async function scaleTextLayer(layer) {
	// Make sure we've actually got a text layer
	if (layer.type !== 'text') {
		throw new Error('Tried to scale a non text layer');
	} else if (layer.text === undefined || layer.text === '') {
		throw new Error('Text layer has empty text property');
	}

	// Create the canvas that will be returned
	let canvas = Canvas.createCanvas(layer.width, layer.height);
	let context = canvas.getContext('2d');

	// Set up our text object
	let text = [
		{
			text: layer.text,
			settings: {
				font: layer.font,
				fillStyle: layer.fillStyle,
			},
		},
	];

	// Do any text replacements we need
	text[0].text = replaceText(text[0].text, layer.textReplace);

	// Split string with fonts
	if (layer.fontReplace !== undefined) {
		text = replaceFonts(text, layer.fontReplace);
	}

	// Split into lines (Manual Line Breaks)
	let lines = manualLineBreaks(text);

	// Scale and wrap Text
	// an object with a scale property and a lines property
	let scaleData = scaleAndWrap(lines, layer);

	// Draw to Canvas
	// Set up the context
	context.textAlign = 'start';
	context.textBaseline = 'alphabetic';
	context.fillStyle = layer.fillStyle;
	context.font = layer.font;
	context.scale(scaleData.scale, scaleData.scale);
	// Cursor, always starts at top of line
	let x;
	let y;

	// Work out our cursor starting y point
	if (layer.baseline === 'bottom') {
		y = layer.height - scaleData.height;
	} else if (layer.baseline === 'middle') {
		y = (layer.height - scaleData.height) / 2;
	} else {
		y = 0;
	}

	scaleData.lines.forEach(line => {
		// Work out our cursor starting x point
		if (layer.align === 'right') {
			x = layer.width - line.width;
		} else if (layer.align === 'center') {
			x = (layer.width - scaleData.width) / 2;
		} else {
			x = 0;
		}
		y += line.baselineHeight;
		line.text.forEach(textObject => {
			// Set the context
			context.fillStyle = textObject.settings.fillStyle;
			context.font = textObject.settings.font;
			// Write to context
			context.fillText(textObject.text, x, y);
			// Set the new x position
			x += context.measureText(textObject.text).width;
		});
		// Set the new y position
		y += line.height;
	});

	// Return the completed Canvas
	return canvas;
}

/**
 * Replace strings in an input string from a replacement object
 * @param {string} inputString The string to replace text in
 * @param {Object} replaceStrings An object of strings to replace, Keys are strings to replace and values are the replacement
 * @returns {string} the new string
 */
function replaceText(inputString, replaceStrings) {
	let outputString = inputString;
	// For each string replacement
	for (const sourceString in replaceStrings) {
		if (!Object.hasOwnProperty.call(replaceStrings, sourceString)) continue;
		const replacementString = replaceStrings[sourceString];
		// Replace all instances of string - Switch to replaceAll if that ever works
		outputString = outputString.split(sourceString).join(replacementString);
	}

	// return the output
	return outputString;
}

/**
 * Replace fonts from an input array based on a replacement object
 * @param {Array<Object>} textArray An array of Text Objects
 * @param {Array<Object>} fontReplaceArray An array of font replacement objects
 * @returns {Array<Object>} the new textArray with fonts matched to strings
 */
function replaceFonts(textArray, fontReplaceArray) {
	// Setup the output object
	let outputTextArray = [];

	// For each element in text Array
	textArray.forEach(textObject => {
		const string = textObject.text;
		const settings = textObject.settings;
		let splits = [];

		// For each fontReplace Object in provided array
		for (let fontReplaceIndex = 0; fontReplaceIndex < fontReplaceArray.length; fontReplaceIndex++) {
			const fontReplace = fontReplaceArray[fontReplaceIndex];
			let foundIndex;
			let startIndex = 0;

			// Find Indexes of all opening string
			do {
				foundIndex = string.indexOf(fontReplace.open, startIndex);
				if (foundIndex >= 0) {
					// Push the found index to splits array
					splits.push({
						index: foundIndex,
						opening: true,
						fontIndex: fontReplaceIndex,
					});
					startIndex = foundIndex + 1;
				}
				// Until the string.indexOf function cant find any more instances of our seperator
			} while (foundIndex !== -1);

			// Find Indexes of all closing string
			// reset to start
			startIndex = 0;
			do {
				foundIndex = string.indexOf(fontReplace.close, startIndex);
				if (foundIndex >= 0) {
					// Push the found index to splits array
					splits.push({
						index: foundIndex,
						opening: false,
						fontIndex: fontReplaceIndex,
					});
					startIndex = foundIndex + 1;
				}
				// Until the string.indexOf function cant find any more instances of our seperator
			} while (foundIndex !== -1);
		}
		// Splits now holds every split, opening and closing

		// Sort the array by index
		splits.sort((a, b) => a.index - b.index);

		// For each split
		let fontReplaceStack = [];
		let stringToSplit = string;
		let removed = 0;
		for (let splitIndex = 0; splitIndex < splits.length; splitIndex++) {
			const split = splits[splitIndex];
			// Get string up to split
			let preSplit = stringToSplit.substring(0, split.index - removed);
			if (split.opening) {
				// Split is opening
				if (preSplit !== '') {
					outputTextArray.push({
						text: preSplit,
						settings: fontReplaceStack[fontReplaceStack.length - 1]?.settings ?? settings,
					});
				}
				fontReplaceStack.push(fontReplaceArray[split.fontIndex]);
				stringToSplit = stringToSplit.substring(split.index + fontReplaceArray[split.fontIndex].open.length - removed);
				removed += preSplit.length + fontReplaceArray[split.fontIndex].open.length;
			} else if (fontReplaceArray[split.fontIndex].close === fontReplaceStack[fontReplaceStack.length - 1]?.close) {
				// Split is closing and matches previously opened
				if (preSplit !== '') {
					outputTextArray.push({
						text: preSplit,
						settings: fontReplaceStack[fontReplaceStack.length - 1]?.settings ?? settings,
					});
				}
				fontReplaceStack.pop();
				stringToSplit = stringToSplit.substring(split.index + fontReplaceArray[split.fontIndex].close.length - removed);
				removed += preSplit.length + fontReplaceArray[split.fontIndex].close.length;
			} else {
				// Split is closing but does not match previous
			}
		}
		// Push whatever is left
		if (stringToSplit !== '') {
			outputTextArray.push({
				text: stringToSplit,
				settings: fontReplaceStack[fontReplaceStack.length - 1]?.settings ?? settings,
			});
		}
	});

	// Return the new object
	return outputTextArray;
}

/**
 * Split an array of text objects into an array of lines at line breaks
 * @param {Array<Object>} textArray An array of text objects
 * @returns {Array<Array<Object>>} An array representing the lines, each line is a textArray
 */
function manualLineBreaks(textArray) {
	let lines = [[]];

	textArray.forEach(textObject => {
		// Try to split by linebreak
		let split = textObject.text.split('\n');
		if (split.length > 1) {
			// Push the first split to the latest line and then remove from splits
			lines[lines.length - 1].push({
				text: split[0],
				settings: textObject.settings,
			});
			split.splice(0, 1);
			// For each element left in split create a new line
			split.forEach(splitString => {
				lines.push([{
					text: splitString,
					settings: textObject.settings,
				}]);
			});
		} else {
			// Just push the current string to the latest line
			lines[lines.length - 1].push({
				text: textObject.text,
				settings: textObject.settings,
			});
		}
	});

	// Return the lines Object
	return lines;
}

/**
 * Wrap lines and calculate a scale based on a layer object
 * @param {Array<Array<Object>>} lines An array representing the lines, each line is a textArray
 * @param {Object} layer The layer object to scale and wrap into
 * @returns {Object} an object containing scale data and wrapped lines
 */
function scaleAndWrap(lines, layer) {
	let maxHeight = layer.height;
	let maxWidth = layer.width;

	// We need to create a canvas to use its measure text function
	let canvas = Canvas.createCanvas(1, 1);
	let context = canvas.getContext('2d');

	let currentHeight = 0;
	let currentWidth = 0;
	let keepScaling = false;
	let finalScale = 1;
	let outputLines;
	// Perform our scaling
	do {
		context.save();
		context.scale(finalScale, finalScale);
		// perform our word wrapping
		outputLines = wrapText(context, lines, layer.wrapText ? maxWidth : -1);
		if (outputLines.length > 1) {
			outputLines.forEach(line => {
				currentHeight += line.height * layer.lineSpacing;
				currentWidth = line.width > currentWidth ? line.height : currentWidth;
			});
		} else {
			currentHeight = outputLines[0].height;
			currentWidth = outputLines[0].width;
		}
		keepScaling = layer.scaleText && currentHeight > maxHeight && currentWidth > maxHeight;
		finalScale = keepScaling ? finalScale * 0.9 : finalScale;
		context.restore();
	} while (keepScaling);

	return {
		scale: finalScale,
		height: currentHeight,
		width: currentWidth,
		lines: outputLines,
	};
}

/**
 * Wrap text into lines that fit within a maximum width
 * @param {NodeCanvasRenderingContext2D} measurementContext The context used to measure text
 * @param {Array<Array<Object>>} linesArray An array representing the lines, each line is a textArray
 * @param {number} maxWidth The maximum width each line can be. Set to -1 for no limit
 * @returns {Array<Array<Object>>} An array representing the lines, each line is a textArray
 */
function wrapText(measurementContext, linesArray, maxWidth) {
	let outputLines = [{
		height: 0,
		baselineHeight: 0,
		width: 0,
		text: [],
	}];
	measurementContext.save();

	// For each line provided
	linesArray.forEach(line => {
		line.forEach(textObject => {
			let currentString = '';
			let metrics;
			// Split the string into words
			let words = textObject.text.split(' ');
			// Setup the context
			measurementContext.font = textObject.settings.font;
			measurementContext.fillStyle = textObject.settings.fillStyle;

			words.forEach(word => {
				let stringToMeasure = `${currentString}${word}`;
				metrics = measurementContext.measureText(stringToMeasure);
				if (maxWidth !== -1 && outputLines[outputLines.length - 1].width + metrics.width > maxWidth) {
					// push current line
					outputLines[outputLines.length - 1].text.push({
						text: currentString.substring(0, currentString.length - 1),
						settings: textObject.settings,
					});
					// Create a new line
					outputLines.push({
						height: 0,
						baselineHeight: 0,
						width: 0,
						text: [],
					});
					// Reset our variables
					outputLines[outputLines.length - 1].width = metrics.width;
					currentString = `${word} `;
				} else {
					// update line info and keep checking current line
					currentString = `${stringToMeasure} `;
					let height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
					outputLines[outputLines.length - 1].height = height > outputLines[outputLines.length - 1].height ? height : outputLines[outputLines.length - 1].height;
					outputLines[outputLines.length - 1].baselineHeight = metrics.actualBoundingBoxAscent > outputLines[outputLines.length - 1].baselineHeight ? metrics.actualBoundingBoxAscent : outputLines[outputLines.length - 1].baselineHeight;
					outputLines[outputLines.length - 1].width = metrics.width;
				}
			});
			// Push everything left into the current line
			outputLines[outputLines.length - 1].text.push({
				text: currentString.substring(0, currentString.length - 1),
				settings: textObject.settings,
			});
			let height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
			outputLines[outputLines.length - 1].height = height > outputLines[outputLines.length - 1].height ? height : outputLines[outputLines.length - 1].height;
			outputLines[outputLines.length - 1].baselineHeight = metrics.actualBoundingBoxAscent > outputLines[outputLines.length - 1].baselineHeight ? metrics.actualBoundingBoxAscent : outputLines[outputLines.length - 1].baselineHeight;
			outputLines[outputLines.length - 1].width = metrics.width;
		});
	});

	// Return
	measurementContext.restore();
	return outputLines;
}

/**
 * Build an image layer object into a canvas
 * @param {Object} layer The image layer object to be created
 * @returns {Canvas} The completed layer image as a canvas
 */
async function scaleImageLayer(layer) {
	if (layer.type !== 'image' && layer.type !== 'mask') {
		throw new Error('Tried to scale a non image layer');
	} else if (layer.url === '') {
		throw new Error('Layer has no URL');
	}

	console.log(`scaling image layer URL: ${layer.url}`);

	// Create a new canvas to return layer
	let canvas = Canvas.createCanvas(layer.width, layer.height);
	let context = canvas.getContext('2d');

	// Get the image
	let image = await Canvas.loadImage(layer.url);

	console.log('image loaded');

	let x = 0;
	let y = 0;
	let ratio = 1;
	let newWidth = 0;
	let newHeight = 0;

	switch (layer.scale) {
		case 'fill':
			// Fill the layer bounds with image (image may go outside of bounds and be cropped)
			// Scale the image to match width
			ratio = image.width / image.height;
			newWidth = layer.width;
			newHeight = newWidth / ratio;
			x = 0;
			y = (newHeight - layer.height) / -2;
			if (newHeight < layer.height) {
				// If height is not enough, scale to match
				newHeight = layer.height;
				newWidth = newHeight * ratio;
				x = (newWidth - layer.width) / -2;
				y = 0;
			}
			break;
		case 'fit':
			// Fit the image to layer bounds (Image may have whitespace on edge)
			// Scale image to match width
			ratio = image.width / image.height;
			newWidth = layer.width;
			newHeight = newWidth / ratio;
			x = 0;
			y = (newHeight - layer.height) / 2;
			if (newHeight > layer.height) {
				// If height is too much, scale to match
				newHeight = layer.height;
				newWidth = newHeight * ratio;
				x = (newWidth - layer.width) / 2;
				y = 0;
			}
			break;
		case 'stretch':
			// Stretch the image to match the layer bounds (Image may be distorted)
			// Just straight up set the width and height to match
			newWidth = layer.width;
			newHeight = layer.height;
			break;
		default:
			break;
	}

	// Set up the drop shadow
	if (layer.dropShadow) {
		context.shadowOffsetX = layer.dropShadow.offsetX;
		context.shadowOffsetY = layer.dropShadow.offsetY;
		context.shadowBlur = layer.dropShadow.shadowBlur;
		context.shadowColor = layer.dropShadow.shadowColor;
	}

	// Write the image to the canvas (crops the image)
	context.drawImage(image, x, y, newWidth, newHeight);

	return canvas;
}

/**
 * Create a new resized canvas
 * @param {Canvas} originalCanvas The canvas to resize
 * @param {number} newWidth The Width of the newly resized canvas
 * @returns {Canvas} The resized canvas
 */
function resizeImage(originalCanvas, newWidth) {
	// Calculate new sizes
	let ratio = originalCanvas.width / originalCanvas.height;
	let newHeight = newWidth / ratio;

	// Build the new Canvas
	let newCanvas = Canvas.createCanvas(newWidth, newHeight);
	newCanvas.getContext('2d').drawImage(originalCanvas, 0, 0, newWidth, newHeight);

	// Return the new Canvas
	return newCanvas;
}

/**
 * Test a conditions object against some data
 * @param {Object} conditions The conditions query - similar to mongo query
 * @param {Object} data The data to test against
 * @returns {bool} Whether the conditions have passed
 */
function testConditions(conditions, data) {
	// If no conditions are specified default true
	if (conditions === undefined) {
		return true;
	}

	// create an array of results
	let results = [];

	// For each condition
	for (const key in conditions) {
		if (!Object.prototype.hasOwnProperty.call(conditions, key)) continue;
		const element = conditions[key];

		if (key === '$or') {
			// Process Or statement
			let anyTrue = false;
			element.forEach(subConditions => {
				let output = testConditions(subConditions, data);
				if (output) {
					anyTrue = true;
				}
			});
			results.push(anyTrue);
			break;
		} else if (key === '$not') {
			// Process Not statement
			let inner = testConditions(element, data);
			results.push(!inner);
			break;
		} else if (typeof element === 'object') {
			// For each property in the object
			for (const subCondition in element) {
				if (!Object.prototype.hasOwnProperty.call(element, subCondition)) continue;
				const subConditionData = element[subCondition];

				// Switch on operators
				switch (subCondition) {
					case '$match':
						// Regex match
						results.push(data[key].match(subConditionData));
						break;

					case '$lt':
						// Less than
						results.push(data[key] < subConditionData);
						break;

					case '$lte':
						// Less than or equal to
						results.push(data[key] <= subConditionData);
						break;

					case '$gt':
						// Greater than
						results.push(data[key] > subConditionData);
						break;

					case '$gte':
						// Greater than or equal to
						results.push(data[key] >= subConditionData);
						break;

					case '$in':
						// In array
						results.push(subConditionData.includes(data[key]));
						break;
					case '$includes':
						// In array
						results.push(data[key].includes(subConditionData));
						break;
					default:
						// Checking sub Objects
						results.push(testConditions(element, data[key]));
						break;
				}
			}
		} else {
			// Check if input equals check condition
			results.push(element === data[key]);
		}
	}

	// Check the results and return false if anything is false
	for (let index = 0; index < results.length; index++) {
		const result = results[index];
		if (!result) {
			return false;
		}
	}
	// Nothing was false so return true
	return true;
}

/*

   ______                       _
  |  ____|                     | |
  | |__  __  ___ __   ___  _ __| |_
  |  __| \ \/ / '_ \ / _ \| '__| __|
  | |____ >  <| |_) | (_) | |  | |_
  |______/_/\_\ .__/ \___/|_|   \__|
              | |
              |_|

*/

module.exports = {
	name: 'Magic: The Gathering Tools',
	description: 'A series of MTG tools',
	test: true,
	commands: [
		{
			name: 'generate-proxy',
			description: 'Generate a custom card proxy',
			options: [
				{
					name: 'name-or-id',
					type: 'STRING',
					description: 'The card name to search for, or the ID to lookup',
					required: true,
				},
				{
					name: 'art-url',
					type: 'STRING',
					description: 'The URL to the Art to use',
					required: true,
				},
				{
					name: 'art-credit',
					type: 'STRING',
					description: 'The name of the artist to credit',
					required: true,
				},
				{
					name: 'frame',
					type: 'STRING',
					description: 'What frame to build the card in.',
					required: false,
					choices: [
						{
							name: 'Unstable Full Art Land',
							value: 'unstableLand',
						},
					],
				},
				{
					name: 'frame-url',
					type: 'STRING',
					description: 'A URL to a custom frame template file',
					required: false,
				},
				{
					name: 'id-type',
					type: 'STRING',
					description: 'The type of ID provided',
					required: false,
					choices: [
						{
							name: 'Scryfall',
							value: 'scryfall',
						},
						{
							name: 'Multiverse',
							value: 'multiverse',
						},
						{
							name: 'Arena',
							value: 'arena',
						},
						{
							name: 'MTG: Online',
							value: 'mtgo',
						},
						{
							name: 'TCG Player ID',
							value: 'tcg',
						},
						{
							name: 'Fuzzy Name',
							value: 'fuzzyName',
						},
						{
							name: 'Exact Name',
							value: 'exactName',
						},
					],
				},
			],
			run: async data => {
				// Defer the interaction while we load card info
				data.interaction.reply('Checking Input ...');

				// Get options
				let search = data.interaction.options[0].value;
				let artURL = data.interaction.options[1].value;
				let artist = data.interaction.options[2].value;
				let frame = data.interaction.options[3]?.value;
				let frameURL = data.interaction.options[4]?.value;
				let idType = data.interaction.options[5]?.value;
				// Verify ID Type
				if (idType === undefined) {
					idType = getIDType(search);
				}
				// Verify Art URL
				if (!artURL.match(/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/)) {
					data.interaction.editReply('Art URL does not seem to be a proper link');
					return;
				}
				// Verify Selected Frame
				let loadFrame;
				if (frame === undefined && frameURL === undefined) {
					data.interaction.editReply('No Frame Selected, Select a default frame or provide a URL');
					return;
				} else if (frame === undefined && frameURL !== undefined && !frameURL.match(/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/)) {
					data.interaction.editReply('Frame URL does not seem to be a proper link');
					return;
				} else if (frame !== undefined) {
					// Load a default frame from a file
					loadFrame = fs.readFile(`./modules/mtgtools/templates/${frame}/template.json`).then(JSON.parse);
				} else {
					// Load a custom remote frame
					loadFrame = loadTemplate(frameURL);
				}

				// Get Remote Data
				Promise.all([
					Scryfall.getCard(search, idType),
					loadFrame,
				]).then(async values => {
					// All Resolved
					// values = [cardData, image, rawFrameData]
					let card = values[0];
					let template = values[1];

					// Ensure this frame supports this card layout
					if (template.supportedLayouts !== undefined && !template.supportedLayouts.includes(card.layout)) {
						data.interaction.editReply(`The provided frame template does not support this card layout`);
						return;
					}

					console.log('loaded resources and layout supported');

					// Inject additional properties into the card
					card.art = artURL;
					card.artist = artist;

					// Create the new card
					data.interaction.editReply('Building Card Image ...');
					let outputFull = await buildImage(template, card);
					let outputSmall = resizeImage(outputFull, 822);
					// Set the DPI
					console.log('Changing Image DPI');
					outputFull = changeDpiDataUrl(outputFull.toDataURL(), template.dpi).replace(/^data:image\/png;base64,/, '');
					outputSmall = changeDpiDataUrl(outputSmall.toDataURL(), 300).replace(/^data:image\/png;base64,/, '');
					// Convert to Buffer
					outputFull = Buffer.from(outputFull, 'base64');
					outputSmall = Buffer.from(outputSmall, 'base64');

					// Upload the Image
					data.interaction.editReply('Uploading Image File ...');
					return uploadImage(data.config.fileHost, outputFull, `${encodeURI(card.name)}.png`)
						.then(downloadURL => {
							// Reply to the original request with the image
							data.interaction.editReply({
								content: '',
								files: [new MessageAttachment(outputSmall, `${encodeURI(card.name)}_small.png`)],
								embeds: [{
									title: `${card.name}`,
									description: `[Download Full Resolution Image](${downloadURL})`,
									url: downloadURL,
									image: { url: `attachment://${encodeURI(card.name)}_small.png` },
								}],
							});
						});
				}).catch(reason => {
					// Something failed
					console.log(`Issue Creating Proxy (${search}): ${reason}`);
					data.interaction.editReply(`Sorry, There was an issue building that card: \n\`${reason}\``);
				});
			},
		},
		{
			name: 'card-search',
			description: 'Search for card info from Scryfall',
			options: [
				{
					name: 'name-or-id',
					type: 'STRING',
					description: 'The card name to search for, or the ID to lookup',
					required: true,
				},
				{
					name: 'id-type',
					type: 'STRING',
					description: 'The type of ID provided',
					required: false,
					choices: [
						{
							name: 'Scryfall',
							value: 'scryfall',
						},
						{
							name: 'Multiverse',
							value: 'multiverse',
						},
						{
							name: 'Arena',
							value: 'arena',
						},
						{
							name: 'MTG: Online',
							value: 'mtgo',
						},
						{
							name: 'TCG Player ID',
							value: 'tcg',
						},
						{
							name: 'Fuzzy Name',
							value: 'fuzzyName',
						},
						{
							name: 'Exact Name',
							value: 'exactName',
						},
					],
				},
			],
			run: (data) => {
				// Defer the interaction while we load card info
				data.interaction.defer();

				// Get options
				let search = data.interaction.options[0].value;
				let idType = data.interaction.options[1]?.value;
				if (idType === undefined) {
					idType = getIDType(search);
				}

				// Search Scryfall
				Scryfall.getCard(search, idType)
					.then(card => {
						// Found a card
						// Build the description
						let description = '';
						let fields = [];
						if (typeof card.card_faces !== 'undefined' && card.card_faces.length > 1) {
							for (const face of card.card_faces) {
								let faceDescription = face.type_line;
								if (typeof face.oracle_text !== 'undefined') faceDescription += `\n${face.oracle_text}`;
								if (typeof face.power !== 'undefined' && typeof face.toughness !== 'undefined') faceDescription += `\n${face.power}/${face.toughness}`;
								if (typeof face.loyalty !== 'undefined') faceDescription += `\nloyalty: ${face.loyalty}`;
								fields.push({
									name: `${face.name} | ${face.mana_cost}`,
									value: faceDescription,
								});
							}
						} else {
							description += `${card.type_line}`;
							if (typeof card.oracle_text !== 'undefined') description += `\n${card.oracle_text}`;
							if (typeof card.power !== 'undefined' && typeof card.toughness !== 'undefined') description += `\n${card.power}/${card.toughness}`;
							if (typeof card.loyalty !== 'undefined') description += `\nloyalty: ${card.loyalty}`;
						}

						data.interaction.followUp({
							embeds: [{
								title: `${card.name} | ${card.mana_cost}`,
								description: description,
								fields: fields,
								thumbnail: {
									url: card.image_uris.small,
								},
								url: card.scryfall_uri,
							}],
						});
					})
					.catch(reason => {
						// Failed to Find
						console.log(`Failed to find card (${search}, ${idType}): ${reason}`);
						data.interaction.followUp(`Sorry, I couldn't find that card`);
					});
			},
		},
	],
};
