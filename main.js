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
const bot = new Discord.Client({ intents: Discord.Intents.ALL });

const modules = {};
const store = JSON.parse(fs.readFileSync('./store.json'));

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
	// Do Nothing on messages for now
}

/**
 * Event Handler Function called When the bot receives an interaction (slash commands)
 * @param {Discord.Interaction} interaction The interaction that triggered this event
 */
function onInteraction(interaction) {
	// Ignore anything thats not a command
	if (!interaction.isCommand()) { return; }
	// For each module
	for (const moduleName in modules) {
		if (!Object.hasOwnProperty.call(modules, moduleName)) continue;
		const module = modules[moduleName];
		// For each command in each module
		for (let index = 0; index < module.commands.length; index++) {
			const command = module.commands[index];
			// If interaction matches this command
			if (interaction.commandName === command.name) {
				// If there is a subcommand
				if (interaction.options.some((element) => element.type === 'SUB_COMMAND')) {
					// Run the SubCommand function
					let subCommand = command.options.find((element) => element.name === interaction.options[0].name);
					console.log(`Running ${command.name} ${subCommand.name}`);
					subCommand.run({
						interaction: interaction,
						store: store[moduleName],
					});
				} else if (interaction.options.some((element) => element.type === 'SUB_COMMAND_GROUP')) {
					// Run the SubCommandGroup SubCommand function
					let subCommandGroup = command.options.find((element) => element.name === interaction.options[0].name);
					let subCommand = subCommandGroup.options.find((element) => element.name === interaction.options[0].options[0].name);
					console.log(`Running ${command.name} ${subCommandGroup.name} ${subCommand.name}`);
					subCommand.run({
						interaction: interaction,
						store: store[moduleName],
					});
				} else {
					// Run the command function
					console.log(`Running ${command.name}`);
					command.run({
						interaction: interaction,
						store: store[moduleName],
					});
				}
			}
		}
	}
}

/**
 * Event Handler Function called once the bot has finished setting up with API
 */
function onReady() {
	console.log('Registering Commands');
	// Register all test commands on test Guild
	bot.guilds.fetch(config.testGuild).then((guild) => {
		// For each module
		for (const moduleName in modules) {
			if (!Object.hasOwnProperty.call(modules, moduleName)) continue;
			const module = modules[moduleName];
			if (module.test) {
				console.log(`Registering Module ${moduleName}`);
				// For each command in each module
				module.commands.forEach(command => {
					console.log(`Registering Command ${command.name}`);
					// Register the command
					guild.commands.create(command)
						.then(() => { console.log(`Succesfully registered ${command.name}`); })
						.catch((e) => {
							console.log(`Error registering ${command.name}`);
							console.log(e);
						});
				});
			}
		}
	});
	// Register all commands
	// For each module
	for (const moduleName in modules) {
		if (!Object.hasOwnProperty.call(modules, moduleName)) continue;
		const module = modules[moduleName];
		if (!module.test) {
			console.log(`Registering Module ${moduleName}`);
			// For each command in each module
			module.commands.forEach(command => {
				console.log(`Registering Command ${command.name}`);
				// Register the command
				bot.application.commands.create(command)
					.then(() => { console.log(`Succesfully registered ${command.name}`); })
					.catch((e) => {
						console.log(`Error registering ${command.name}`);
						console.log(e);
					});
			});
		}
	}

	// Interval Functions
	bot.setInterval(() => {
		// For each module
		for (const moduleName in modules) {
			if (!Object.hasOwnProperty.call(modules, moduleName)) continue;
			const module = modules[moduleName];
			if (typeof module.runOnInterval !== 'function') {
				module.runOnInterval({
					bot: bot,
					store: store[moduleName],
				});
			}
		}
	}, config.intervalFunctionTime);

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
	bot.on('interaction', onInteraction);

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
			let tempModule = require(`./modules/${file}`);

			// Verify that the module contains valid fields
			if (typeof tempModule.name === 'string' &&
			    typeof tempModule.description === 'string' &&
			    Array.isArray(tempModule.commands)) {
				// Save the module to the modules variable
				modules[tempModule.name] = tempModule;
				// Set the store if it is empty already
				if (modules[tempModule.name].store === undefined) modules[tempModule.name].store = {};
				if (store[tempModule.name] === undefined) store[tempModule.name] = modules[tempModule.name].store;
				loadedModules += 1;
				console.log(`${tempModule.name} Verified and Loaded`);
			} else {
				console.log(`${tempModule.name} Failed to Verify`);
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

/*

    _____ _
   / ____| |
  | |    | | ___  __ _ _ __  _   _ _ __
  | |    | |/ _ \/ _` | '_ \| | | | '_ \
  | |____| |  __/ (_| | | | | |_| | |_) |
   \_____|_|\___|\__,_|_| |_|\__,_| .__/
                                  | |
                                  |_|

*/
// https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits

function exitHandler(options, exitCode) {
	if (options.cleanup) {
		console.log('Cleaning up');
		bot.destroy();
		fs.writeFileSync(`./store.json`, JSON.stringify(store));
	}
	if (exitCode || exitCode === 0) console.log(exitCode);
	if (options.exit) process.exit();
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
