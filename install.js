// Node Modules
const fs = require('fs');

// Read Current Directory
fs.readdir(`./`, (error, files) => {
	if (error) {
		// Failed to read the directory
		return console.log(`Issue reading base folder: ${error.message}`);
	}
	if (files === undefined || files.length < 2) {
		// got a return but missing like everything
		return console.log(`No files are available including this one. (This error shouldn't appear but if it does you've done something very wrong)`);
	}

	// Setup some variables
	let modules = false,
		library = false,
		config = false;

	// Iterate over each item looking for what needs to be setup
	for (var i = 0; i < files.length; i++) {
		let stats = fs.statSync(files[i]);

		if (files[i] === `modules` && stats.isDirectory()) {
			modules = true;
		} else if (files[i] === `library` && stats.isDirectory()) {
			library = true;
		} else if (files[i] === `config.js` && stats.isFile()) {
			config = true;
		}
	}
	
	// Setup anything thats not already setup
	if (!modules) {
		console.log(`Modules folder not found, creating one now.`);
		fs.mkdirSync(`modules`);
	}
	if (!library) {
		console.log(`Library folder not found, creating one now.`);
		fs.mkdirSync(`library`);
	}
	if (!config) {
		console.log(`Config file not found, creating one now.`);
		fs.writeFileSync(`./config.js`, fs.readFileSync(`./example_config.js`));
	}
});