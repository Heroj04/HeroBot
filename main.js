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
	// Check for modules command
	if (interaction.commandName === 'modules') {
		modulesCommand(interaction);
	}
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
						config: config,
					});
				} else if (interaction.options.some((element) => element.type === 'SUB_COMMAND_GROUP')) {
					// Run the SubCommandGroup SubCommand function
					let subCommandGroup = command.options.find((element) => element.name === interaction.options[0].name);
					let subCommand = subCommandGroup.options.find((element) => element.name === interaction.options[0].options[0].name);
					console.log(`Running ${command.name} ${subCommandGroup.name} ${subCommand.name}`);
					subCommand.run({
						interaction: interaction,
						store: store[moduleName],
						config: config,
					});
				} else {
					// Run the command function
					console.log(`Running ${command.name}`);
					command.run({
						interaction: interaction,
						store: store[moduleName],
						config: config,
					});
				}
			}
		}
	}
}

/**
 * Event Handler Function called once the bot has finished setting up with API
 */
async function onReady() {
	// Register commands
	registerCommands();
	// Interval Functions
	bot.setInterval(() => {
		// For each module
		for (const moduleName in modules) {
			if (!Object.hasOwnProperty.call(modules, moduleName)) continue;
			const module = modules[moduleName];
			// If Module Interval Function Exists
			if (typeof module.runOnInterval === 'function') {
				// Run the Function
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
 * Register all the bots commands
 */
async function registerCommands() {
	console.log('Registering Commands');
	// Register commands on Guilds
	let guildCollection = await bot.guilds.fetch();
	guildCollection.each(async partialGuild => {
		let guild = await partialGuild.fetch();
		// For each module
		for (const moduleName in modules) {
			if (!Object.hasOwnProperty.call(modules, moduleName)) continue;
			const module = modules[moduleName];
			// If this module is enabled on this guild
			if (store.enabledModules?.[guild.id]?.includes(moduleName)) {
				// For each command in each module
				module.commands.forEach(command => {
					// Register the command
					guild.commands.create(command);
				});
			}
		}
	});

	bot.application.commands.create({
		name: 'modules',
		description: 'Module Settings',
		defaultPermission: false,
		options: [
			{
				name: 'list',
				type: 'SUB_COMMAND',
				description: 'Change guild Settings for birthday module',
				options: [
					{
						name: 'filter',
						type: 'STRING',
						description: 'What modules to list',
						required: false,
						choices: [
							{
								name: 'All',
								value: 'all',
							},
							{
								name: 'Enabled',
								value: 'enabled',
							},
						],
					},
				],
			},
			{
				name: 'enable',
				type: 'SUB_COMMAND',
				description: 'Enable a module on this guild',
				options: [
					{
						name: 'module-name',
						type: 'STRING',
						description: 'What module to enable',
						required: true,
					},
				],
			},
			{
				name: 'disable',
				type: 'SUB_COMMAND',
				description: 'Disable a module on this guild',
				options: [
					{
						name: 'module-name',
						type: 'STRING',
						description: 'What module to disable',
						required: true,
					},
				],
			},
			{
				name: 'cleanup',
				type: 'SUB_COMMAND',
				description: 'Remove all commands and re add them',
				options: [
					{
						name: 'module-name',
						type: 'STRING',
						description: 'What module to disable',
						required: true,
					},
				],
			},
		],
	});
}

/**
 * Function run to manage modules via a command
 * @param {Discord.CommandInteraction} interaction The interaction that triggered the command
 */
async function modulesCommand(interaction) {
	let options = interaction.options[0].options;
	let subcommand = interaction.options[0].value;
	switch (subcommand) {
		case 'list': {
			let reply = 'Available Modules\n';
			let filter = options[0].value;
			for (const moduleName in modules) {
				if (!Object.hasOwnProperty.call(modules, moduleName)) continue;
				const module = modules[moduleName];
				if (filter === 'all' || (filter === 'enabled' && store.enabledModules?.[interaction.guildID]?.includes(moduleName))) {
					reply += `${moduleName} - ${module.description}`;
				}
			}
			interaction.reply(reply);
			break;
		}
		case 'enable': {
			let moduleToEnable = options[0].value;
			if (module[moduleToEnable] === undefined) {
				interaction.reply(`Module \`${moduleToEnable}\` does not exist`);
			} else if (store.enabledModules?.[interaction.guildID]?.includes(moduleToEnable)) {
				interaction.reply(`Module \`${moduleToEnable}\` is already enabled`);
			} else {
				if (store.enabledModules === undefined) store.enabledModules = {};
				if (store.enabledModules[interaction.guildID] === undefined) store.enabledModules[interaction.guildID] = [];
				store.enabledModules[interaction.guildID].push(moduleToEnable);
				// Register all modules commands
				modules[moduleToEnable].commands.forEach(command => {
					interaction.guild.commands.add(command);
				});
				interaction.reply(`Module \`${moduleToEnable}\` has been enabled`);
			}
			break;
		}
		default:
			break;
	}
	interaction.reply('Not yet implemented');
}

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
	fs.readdir('./modules/', { withFileTypes: true }, (error, dirents) => {
		const files = dirents
			.filter(dirent => dirent.isFile())
			.map(dirent => dirent.name);
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
