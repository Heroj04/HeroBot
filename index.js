const Discord = require(`eris`);
const fs = require(`fs`);

var config, bot;

function log(message, level) {
	level = typeof level === `undefined` ? 20 : level;
	// Assume to only show warning and errors
	let debug = typeof config === `undefined` ? 30 : config.debugLevel === undefined ? 30 : config.debugLevel;
	if (level >= debug) {
		switch (level) {
			case 10:
				console.log(`\x1b[0m[COMMAND] ${message}\x1b[0m`);
				break;
			case 20:
				console.info(`\x1b[32m[INFO]    ${message}\x1b[0m`);
				break;
			case 30:
				console.warn(`\x1b[33m[WARNING] ${message}\x1b[0m`);
				break;
			case 40:
				console.error(`\x1b[31m[ERROR]  ${message}\x1b[0m`);
				break;
			case 50:
				console.log(`\x1b[0m[BOT]     ${message}\x1b[0m`);
				break;
			default:
				console.log(`\x1b[0m[?]       ${message}\x1b[0m`);
		}
	}
}

var commands = [
	// {name: 'example', return: 'function/string', options: {}}
	{
		name: 'Ping',
		return: 'Pong!',
		options: {
			aliases: ['Ping!'],
			description: 'Return "Pong!"',
			fullDescription: 'It literally just sends a message in the same channel which says "Pong!"',
		},
	},
];

function initialise() {
	// Do things to set up the bot

	log(`Starting Bot ...`, 50);
	fs.readdir(`./`, (err, files) => {
		if (err) {
			return log(`Issue reading base folder: ${err}`, 40);
		}
		if (files === undefined || files.length < 2) {
			return log(`No files are available including this one. (This error shouldn't appear but if it does you've done something very wrong)`, 40);
		}
		let conf = false;
		for (let i = 0; i < files.length; i++) {
			let stats = fs.statSync(files[i]);
			if (files[i] === `config.js` && stats.isFile()) {
				conf = true;
			}
		}
		if (!conf) {
			log(`Config file not found, creating one now.`, 30);
			fs.writeFileSync(`./config.js`, fs.readFileSync(`./example_config.js`));
		}
		log(`Loading config file ...`, 20);
		config = require(`./config.js`);
		log(`Logging in ...`, 20);
		bot = new Discord.CommandClient(
			config.botToken,
			{
				// Bot Options
			},
			{
				// Command Options
				description: 'A bot to make sound and text tags',
				owner: '@Heroj04',
				defaultCommandOptions: {
					caseInsensitive: true,
					deleteCommand: true,
					guildOnly: true,
					cooldownMessage: 'You\'re using this command faster than I can cool down.',
					permissionMessage: 'You don\'t have permissions for that command. Make sure you are in a role with the name "radiobot-dj".',
					errorMessage: '[ERROR] Something went wrong processing that command, try again later and if errors persist contact your administrator.',
				},
			}
		);

		bot
			.on('error', error => {
				log(`Bot Error: ${error}`, 40);
			})
			.on('ready', () => {
				log(`Bot Connected and Ready`, 50);
			});

		for (let i = 0; i < commands.length; i++) {
			bot.registerCommand(
				commands[i].name,
				commands[i].return,
				commands[i].options
			);
		}
		bot.connect();
	});
}

initialise();
