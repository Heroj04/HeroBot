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
				console.log(`[INFO] Disabling ${mod.moduleOptions.name} module`);
				delete modules[modules.indexOf(mod)];
			}
		}
	});
});

bot.on(`message`, (msg) => {
	if (msg.author.bot) {
		return;
	}

	if (msg.channel.type === `text`) {
		let cont = msg.content.substring(0, 2) + msg.content.substring(3, msg.content.length - 3);
		if (!cont.startsWith(`<@${bot.user.id}>`)) {
			return;
		}
	}

	let split = msg.content.toLowerCase()
		.split(` `);
	let cmdString = split[1];
	split.splice(0, 2);
	console.log(`[COMMAND] (${new Date().getHours()}: ${new Date().getMinutes()}) ${msg.author.tag}: ${msg.cleanContent}`);
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
			}
		} else {
			msg.channel.send(`You do not have permission for that command.`)
				.then(m => {
					m.delete(10000);
				});
			msg.delete(10000);
		}
	} else {
		msg.channel.send(`That command does not exist.`)
			.then(m => {
				m.delete(10000);
			});
		msg.delete(10000);
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
					command.usage = command.usage === undefined ? `No usage info was provided with this command` : command.usage;
					command.dm = command.dm === undefined ? false : command.dm;
					command.owner = command.owner === undefined ? false : command.owner;
				});
				console.log(`[INFO] Loaded module ${file}`);
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

	console.log(`[INFO] Starting Bot ...`);
	fs.readdir(`./`, (err, files) => {
		if (err) {
			return console.error(err);
		}
		if (files === undefined || files.length < 1) {
			return console.error(`[ERROR] No files are available including this one. (This error shouldn't appear but if it does you've done something wrong)`);
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
			console.log(`[INFO] Modules folder not found, creating one now.`);
			fs.mkdirSync(`modules`);
		}
		if (!lib) {
			console.log(`[INFO] Library folder not found, creating one now.`);
			fs.mkdirSync(`library`);
		}
		if (!conf) {
			console.log(`[INFO] Config file not found, creating one now.`);
			fs.writeFileSync(`./config.js`, fs.readFileSync(`./example_config.js`));
		}
		console.log(`[INFO] Loading config file ...`);
		config = require(`./config.js`);
		console.log(`[INFO] Loading Modules ...`);
		fs.readdir(`modules`, (e, modFiles) => {
			if (e) {
				throw e;
			}

			let modTotal = loadModules(modFiles);
			console.log(`[INFO] Loaded [${modTotal}/${modFiles.length}] modules.`);
			if (modTotal > 0) {
				console.log(`[INFO] Logging in ...`);
				bot.login(config.botToken)
					.then(() => {
						console.log(`[INFO] Bot successfully logged in.`);
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
