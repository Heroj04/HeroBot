const Discord = require(`discord.js`);
const fs = require(`fs`);

var config;

var bot = new Discord.Client();

var modules = [];

// Command object class
/*
function command(obj) {
	// Required properties
	this.name = obj.name;
	this.func = obj.func;

	// Optional properties (But highly recommended)
	this.aliases = obj.aliases === undefined ? [] : obj.aliases;
	this.help = obj.help === undefined ? `No help info was provided for this command` : obj.help;
	this.usage = obj.usage === undefined ? `No usage info was provided with this command` : obj.usage;
	this.dm = obj.dm === undefined ? false : obj.dm;
	this.owner = obj.owner === undefined ? false : obj.owner;
}
*/

function log(message, level) {
	level = typeof level === `undefined` ? 20 : level;
	let debug = typeof config === `undefined` ? 0 : config.debugLevel === undefined ? 0 : config.debugLevel;
	if (level >= debug) {
		switch (level) {
			case 10:
				console.log(`\x1b[0m[COMMAND] ${message}\x1b[0m`);
				break;
			case 20:
				console.info(`\x1b[32m[INFO] ${message}\x1b[0m`);
				break;
			case 30:
				console.warn(`\x1b[33m[WARNING] ${message}\x1b[0m`);
				break;
			case 40:
				console.error(`\x1b[31m[ERROR] ${message}\x1b[0m`);
				break;
			default:
				console.log(`\x1b[0m[?] ${message}\x1b[0m`);
		}
	}
}

bot.on(`error`, e => {
	log(`Bot Error: ${e}`, 40);
});

bot.on(`ready`, () => {
	bot.user.setGame(config.gameText);
	log(`Running module startup functions ...`, 20);
	modules.forEach(mod => {
		if (typeof mod.startup === `function`) {
			try {
				mod.startup({
					bot: bot,
					library: `./library/${mod.moduleOptions.name.toLowerCase().replace(/\s+/g, '')}`,
					log: log,
					modules: modules,
				});
			} catch (e) {
				log(`${mod.moduleOptions.name} module encountered an error in startup function: ${e}`, 40);
				log(`Disabling ${mod.moduleOptions.name} module`, 20);
				delete modules[modules.indexOf(mod)];
			}
		}
	});
});

bot.on(`message`, (msg) => {
	if (msg.author.bot) {
		return;
	}

	let cont;
	if (msg.content[2] === `!`) {
		cont = msg.content.substring(0, 2) + msg.content.substring(3, msg.content.length - 3);
	} else {
		cont = msg.content;
	}
	if (!cont.startsWith(`<@${bot.user.id}>`)) {
		return;
	}

	let split = msg.content.toLowerCase()
		.split(` `);
	let cmdString = split[1];
	split.splice(0, 2);
	// Check messages recieved for commands

	let found = false;
	let modName = ``;
	for (var i = 0; i < modules.length; i++) {
		for (var j = 0; j < modules[i].commands.length; j++) {
			if (cmdString === modules[i].commands[j].name || modules[i].commands[j].aliases.indexOf(cmdString) >= 0) {
				found = modules[i].commands[j];
				modName = modules[i].moduleOptions.name;
				break;
			}
		}
		if (found) {
			break;
		}
	}
	let reason;
	if (found) {
		if (!found.owner || config.ownerID.indexOf(msg.author.id) >= 0) {
			if (msg.channel.type === `text` || (msg.channel.type !== `text` && found.dm)) {
				found.func({
					msg: msg,
					bot: bot,
					library: `./library/${modName.toLowerCase().replace(/\s+/g, '')}`,
					modules: modules,
					log: log,
					args: split,
				});
			} else {
				msg.channel.send(`Sorry that command cannot be used in this channel`)
					.then(m => {
						m.delete(10000);
					});
				msg.delete(10000);
				reason = `Channel`;
			}
		} else {
			msg.channel.send(`You do not have permission for that command.`)
				.then(m => {
					m.delete(10000);
				});
			msg.delete(10000);
			reason = `Permission`;
		}
	} else {
		msg.channel.send(`That command does not exist.`)
			.then(m => {
				m.delete(10000);
			});
		msg.delete(10000);
		reason = `Exist`;
	}
	if (reason) {
		log(`[Failed: ${reason}] (${new Date().getHours()}: ${new Date().getMinutes()}) ${msg.author.tag}: ${msg.cleanContent}`, 10);
	} else {
		log(`[Success] (${new Date().getHours()}: ${new Date().getMinutes()}) ${msg.author.tag}: ${msg.cleanContent}`, 10);
	}
});

function loadModules(files) {
	let modTotal = 0;
	files.forEach((file, index) => {
		let stats = fs.statSync(`modules/${file}`);

		if (stats.isFile()) {
			try {
				modules.push(require(`./modules/${file}`));
				modules[modules.length - 1].commands.forEach(command => {
					command.aliases = command.aliases === undefined ? [] : command.aliases;
					command.help = command.help === undefined ? `No help info was provided for this command` : command.help;
					command.usage = command.usage === undefined ? `No usage info was provided with this command, it is likely just a command which takes no arguments` : command.usage;
					command.dm = command.dm === undefined ? false : command.dm;
					command.owner = command.owner === undefined ? false : command.owner;
				});
				try {
					fs.mkdirSync(`./library/${modules[modules.length - 1].moduleOptions.name.toLowerCase().replace(/\s+/g, '')}`);
				} catch (error) {
					if (error.code !== `EEXIST`) {
						throw error;
					}
				}
				log(`Loaded module ${file}`, 20);
				modTotal++;
			} catch (e) {
				log(`Could not load module ${file}: ${e.message}`, 40);
			}
		}
	});
	return modTotal;
}

function initialise() {
	// Do things to set up the bot

	log(`Starting Bot ...`, 20);
	fs.readdir(`./`, (err, files) => {
		if (err) {
			return log(`Issue reading base folder: ${err}`, 40);
		}
		if (files === undefined || files.length < 2) {
			return log(`No files are available including this one. (This error shouldn't appear but if it does you've done something very wrong)`, 40);
		}
		let mods = false,
			lib = false,
			conf = false;
		for (var i = 0; i < files.length; i++) {
			let stats = fs.statSync(files[i]);
			if (files[i] === `modules` && stats.isDirectory()) {
				mods = true;
			} else if (files[i] === `library` && stats.isDirectory()) {
				lib = true;
			} else if (files[i] === `config.js` && stats.isFile()) {
				conf = true;
			}
		}
		if (!mods) {
			log(`Modules folder not found, creating one now.`, 30);
			fs.mkdirSync(`modules`);
		}
		if (!lib) {
			log(`Library folder not found, creating one now.`, 20);
			fs.mkdirSync(`library`);
		}
		if (!conf) {
			log(`Config file not found, creating one now.`, 30);
			fs.writeFileSync(`./config.js`, fs.readFileSync(`./example_config.js`));
		}
		log(`Loading config file ...`, 20);
		config = require(`./config.js`);
		log(`Loading Modules ...`, 20);
		fs.readdir(`modules`, (e, modFiles) => {
			if (e) {
				throw e;
			}

			let modTotal = loadModules(modFiles);
			log(`Loaded [${modTotal}/${modFiles.length}] modules.`, 20);
			if (modTotal > 0) {
				log(`Logging in ...`, 20);
				bot.login(config.botToken)
					.then(() => {
						log(`Bot successfully logged in.`, 20);
					})
					.catch(error => {
						log(`Issue Logging in: ${err}`, 40);
					});
			} else {
				log(`No modules were loaded.`, 40);
			}
		});
	});
}

initialise();
