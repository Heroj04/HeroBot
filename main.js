// Setup
// Node Modules
const Discord = require('discord.js');
const fs = require('fs');

// Variables
const config = JSON.parse(fs.readFileSync('./config.js'));
const bot = new Discord.Client();

// Event Handler Functions
// Called when the bot receives a message
function onMessage(message) {
	if (message.author.bot) {
		// Ignore message from a bot user
		return;
	}
	if (message.content == 'ping') {
		message.channel.send('pong');
	}
}

// Called when the bot is setup and ready
function onReady() {
	console.log('ready');
}

// Called when the bot encounters an error
function onError(error) {
	console.log('ERROR: ', error.message);
}

// Other Functions
// Setup the Bot
function initialise() {
	// Attatch Bot Event Functions
	bot.on('message', onMessage);
	bot.on('ready', onReady);
	bot.on('error', onError);

	// Setup the bot
	bot.login(config.botToken)
		.then(() => {
			console.log('Bot Logged in');
		})
		.catch((error) => {
			console.log('ERROR: ', error.message);
		});
}

// Load Available Command Modules
function loadModules() {
	
}

// Start
initialise();