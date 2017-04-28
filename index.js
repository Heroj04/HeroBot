const Discord = require(`discord.js`);
const fs = require(`fs`);

const config = require(`./config.js`);

var bot = new Discord.Client();

var modules = {};

// Command object class
function command(obj) {
	// Required properties
	this.name = obj.name;
	this.func = obj.func;

	// Optional properties (But highly recommended)
	this.aliases = obj.aliases === undefined ? [] : obj.aliases;
	this.help = obj.help === undefined ? `No help info was provided for this command` : obj.help;
	this.usage = obj.usage === undefined ? `No usage info was provided with this command` : obj.usage;
	this.dm = obj.dm === undefined ? false : obj.dm;
}

bot.on(`ready`, () => {
	bot.setGame(`@Radio Help`);
});

bot.on(`message`, (msg) => {
	if (msg.author.bot) {
		return;
	}

	let cmdString = msg.content.toLowercase().split(` `)[1];
	// Check messages recieved for commands

	for (var mod in modules) {
		let found = false;
		if (modules.hasOwnProperty(mod)) {
			for (var i = 0; i < mod.commands.length; i++) {
				if (cmdString === mod.commands[i].name || mod.commands[i].aliases.indexOf(cmdString) >= 0) {
					found = mod.commands[i];
					break;
				}
			}
			if (found) {
				break;
			}
		}
		if (found) {
			found.func();
		} else {
			msg.channel.send(`That command does not exist.`);
		}
	}
});

function loadModules(files) {
	let modTotal = 0;
	files.forEach((file, index) => {
		let stats = fs.statSync(`modules/${file}`);

		if (stats.isFile()) {
			try {
				modules[file.substring(0, file.indexOf(`.js`))] = require(`./modules/${file}`);
				console.log(`Loaded module ${file}`);
				modTotal++;
			} catch (e) {
				console.log(`[ERROR] Could not load module ${file}: ${e}`);
			}
		}
	});
	return modTotal;
}

function initialise() {
	// Do things to set up the bot

	console.log(`Starting Bot ...`);
	fs.readdir(`modules`, (err, files) => {
		if (err) {
			return console.error(err);
		}

		console.log(`Loading Modules ...`);
		let modTotal = loadModules(files);
		console.log(`Loaded [${modTotal}/${files.length}] modules.`);

		if (modTotal > 0) {
			console.log(`Logging in ...`);
			bot.login(config.botToken)
				.then(() => {
					console.log(`Bot successfully logged in.`);
				})
				.catch((error) => {
					console.error(`[ERROR] Issue Logging in: ${err}`);
				});
		} else {
			console.error(`[ERROR] No modules were loaded`);
		}
	});
}

initialise();
