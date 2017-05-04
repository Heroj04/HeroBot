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

bot.on(`ready`, () => {
	bot.user.setGame(config.gameText);
	console.log(`\x1b[33m[INFO] Running module startup functions ...\x1b[0m`);
	modules.forEach(mod => {
		if (typeof mod.startup === `function`) {
			try {
				mod.startup({
					bot: bot,
					library: `./library/${mod.moduleOptions.name.toLowerCase().replace(/\s+/g, '')}`,
					modules: modules,
				});
			} catch (e) {
				console.error(`[ERROR] ${mod.moduleOptions.name} module encountered an error in startup function: ${e}`);
				console.log(`\x1b[33m[INFO] Disabling ${mod.moduleOptions.name} module\x1b[0m`);
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
		console.log(`[COMMAND] [Failed: ${reason}] (${new Date().getHours()}: ${new Date().getMinutes()}) ${msg.author.tag}: ${msg.cleanContent}`);
	} else {
		console.log(`[COMMAND] [Success] (${new Date().getHours()}: ${new Date().getMinutes()}) ${msg.author.tag}: ${msg.cleanContent}`);
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
				console.log(`\x1b[33m[INFO] Loaded module ${file}\x1b[0m`);
				modTotal++;
			} catch (e) {
				console.log(`\x1b[31m[ERROR] Could not load module ${file}: ${e.message}\x1b[0m`);
			}
		}
	});
	return modTotal;
}

function initialise() {
	// Do things to set up the bot

	console.log(`\x1b[33m[INFO] Starting Bot ...\x1b[0m`);
	fs.readdir(`./`, (err, files) => {
		if (err) {
			return console.error(err);
		}
		if (files === undefined || files.length < 1) {
			return console.error(`\x1b[31m[ERROR] No files are available including this one. (This error shouldn't appear but if it does you've done something wrong)\x1b[0m`);
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
			console.log(`\x1b[33m[INFO] Modules folder not found, creating one now.\x1b[0m`);
			fs.mkdirSync(`modules`);
		}
		if (!lib) {
			console.log(`\x1b[33m[INFO] Library folder not found, creating one now.\x1b[0m`);
			fs.mkdirSync(`library`);
		}
		if (!conf) {
			console.log(`\x1b[33m[INFO] Config file not found, creating one now.\x1b[0m`);
			fs.writeFileSync(`./config.js`, fs.readFileSync(`./example_config.js`));
		}
		console.log(`\x1b[33m[INFO] Loading config file ...\x1b[0m`);
		config = require(`./config.js`);
		console.log(`\x1b[33m[INFO] Loading Modules ...\x1b[0m`);
		fs.readdir(`modules`, (e, modFiles) => {
			if (e) {
				throw e;
			}

			let modTotal = loadModules(modFiles);
			console.log(`\x1b[33m[INFO] Loaded [${modTotal}/${modFiles.length}] modules.\x1b[0m`);
			if (modTotal > 0) {
				console.log(`\x1b[33m[INFO] Logging in ...\x1b[0m`);
				bot.login(config.botToken)
					.then(() => {
						console.log(`\x1b[33m[INFO] Bot successfully logged in.\x1b[0m`);
					})
					.catch(error => {
						console.error(`\x1b[31m[ERROR] Issue Logging in: ${err}\x1b[0m`);
					});
			} else {
				console.error(`\x1b[31m[ERROR] No modules were loaded\x1b[0m`);
			}
		});
	});
}

initialise();
