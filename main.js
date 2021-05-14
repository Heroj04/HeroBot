/*
 
    _____      _               
   / ____|    | |              
  | (___   ___| |_ _   _ _ __  
   \___ \ / _ \ __| | | | '_ \ 
   ____) |  __/ |_| |_| | |_) |
  |_____/ \___|\__|\__,_| .__/ 
                        | |    
                        |_|    
 
*/

// Node Modules
const Discord = require('discord.js');
const fs = require('fs');

// Variables
const config = JSON.parse(fs.readFileSync('./config.json'));
const bot = new Discord.Client();

const modules = {};

/*
 
   ______               _     _    _                 _ _             ______                _   _                 
  |  ____|             | |   | |  | |               | | |           |  ____|              | | (_)                
  | |____   _____ _ __ | |_  | |__| | __ _ _ __   __| | | ___ _ __  | |__ _   _ _ __   ___| |_ _  ___  _ __  ___ 
  |  __\ \ / / _ \ '_ \| __| |  __  |/ _` | '_ \ / _` | |/ _ \ '__| |  __| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
  | |___\ V /  __/ | | | |_  | |  | | (_| | | | | (_| | |  __/ |    | |  | |_| | | | | (__| |_| | (_) | | | \__ \
  |______\_/ \___|_| |_|\__| |_|  |_|\__,_|_| |_|\__,_|_|\___|_|    |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
                                                                                                                 
                                                                                                                 
 
*/

/**
 * Event Handler Function called whenever a message is received by the bot
 * @param {Discord.Message} message The message that was received
 * @returns {void}
 */
function onMessage(message) {
	if (message.author.bot) {
		// Ignore message from a bot user
		return;
	}
	if (message.content === 'ping') {
		message.channel.send('pong');
	}
}

/**
 * Event Handler Function called once the bot has finished setting up with API
 */
function onReady() {
	console.log('ready');
}

/**
 * Event Handler Function called when the bot encounters an API error
 * @param {Error} error the error thrown
 */
function onError(error) {
	console.log('ERROR: ', error.message);
}

/*
 
    ____  _   _                 ______                _   _                 
   / __ \| | | |               |  ____|              | | (_)                
  | |  | | |_| |__   ___ _ __  | |__ _   _ _ __   ___| |_ _  ___  _ __  ___ 
  | |  | | __| '_ \ / _ \ '__| |  __| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
  | |__| | |_| | | |  __/ |    | |  | |_| | | | | (__| |_| | (_) | | | \__ \
   \____/ \__|_| |_|\___|_|    |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
                                                                            
                                                                            
 
*/

/**
 * Called when the bot first starts
 * Sets up the Bot i.e., API Connection etc
 */
function initialise() {
	// Attatch Bot Event Functions
	bot.on('message', onMessage);
	bot.on('ready', onReady);
	bot.on('error', onError);

	// Find and register all our command modules
	loadModules();

	// Setup the bot
	bot.login(config.botToken)
		.then(() => {
			console.log('Bot Logged in');
		})
		.catch((error) => {
			console.log('ERROR: ', error.message);
		});
}

/**
 * Loads all found modules into the bot
 */
function loadModules() {
	fs.readdir('./modules/', (error, files) => {
		if (error) {
			// Failed to read the directory
			throw new Error(`Issue reading base folder: ${error.message}`);
		}

		// Iterate over each found module
		let loadedModules = 0;
		files.forEach(file => {
			console.log(`Loading ${file}`);
			// Load the module to a temp location
			let tempModule = require(`./${file}`);

			// Verify that the module contains valid fields
			if (typeof tempModule.name === 'string' &&
			    typeof tempModule.description === 'string' &&
			    Array.isArray(tempModule.commands)) {
				// Save the module to the modules variable
				modules[tempModule.name] = tempModule;
				loadedModules += 1;
				console.log(`${tempModule.name} Verified and Loaded`);
			}
		});
		console.log(`Loaded ${loadedModules}\\${files.length} Modules`);
	});
}

/*
 
    _____ _             _   
   / ____| |           | |  
  | (___ | |_ __ _ _ __| |_ 
   \___ \| __/ _` | '__| __|
   ____) | || (_| | |  | |_ 
  |_____/ \__\__,_|_|   \__|
                            
                            
 
*/

initialise();
