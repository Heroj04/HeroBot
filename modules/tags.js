const fs = require(`fs`);

var tags = {};

module.exports = {
	moduleOptions: {
		name: `Tagging`,
		description: `Tag messages to recall later`,
		author: `Heroj04`,
		version: `1.0.0`,
	},
	startup: args => {
		fs.readdir(args.library, (err, files) => {
			if (err) {
				throw err;
			}
			let guilds = args.bot.guilds.array();
			for (var i = 0; i < guilds.length; i++) {
				let stats;
				try {
					stats = fs.statSync(`${args.library}/${guilds[i].id}.json`);
					if (stats.isFile()) {
						tags[guilds.id] = JSON.parse(fs.readFileSync(`${args.library}/${guilds[i].id}.json`));
					}
				} catch (e) {
					if (e.code === `ENOENT`) {
						fs.writeFileSync(`${args.library}/${guilds[i].id}.json`, `[]`);
						tags[guilds.id] = [];
					}
				}
			}
		});
	},
	commands: [
		{
			name: `tag`,
			aliases: [],
			usage: `Tag <tagName>`,
			help: `Displays a saved tag.`,
			func: (args) => {
				if (args.args.length > 0) {
					try {
						let found;
						for (var i = 0; i < tags[args.msg.guild.id].length; i++) {
							if (args.args[1].toLowerCase() === tags[args.msg.guild.id][i].name) {
								found = tags[args.msg.guild.id][i];
								break;
							}
						}
						if (found) {
							args.msg.edit(found.content);
						} else {
							args.msg.channel.send(`Sorry, that tag doesn't seem to exist.`);
						}
					} catch (e) {
						console.error(`[ERROR] Issue retrieving tags for server ID ${args.msg.guild.id}: ${e}`);
						args.msg.channel.send(`Error retrieving tags for this server.`);
					}
				} else {
					args.msg.channel.send(`Incorrect syntax refer to 'help tag' for more info`);
				}
			},
		},
		{
			name: `taglist`,
			aliases: [`tags`, `displaytags`, `showtags`],
			help: `Displays a list of saved tags.`,
			func: (args) => {
				let compMsg;
				try {
					if (tags[args.msg.guild.id].length > 0) {
						compMsg = `Tags for ${args.msg.guild.name}`;
						for (var i = 0; i < tags[args.msg.guild.id].length; i++) {
							compMsg += `\n - ${tags[args.msg.guild.id][i].name}`;
						}
					} else {
						compMsg = `There are no tags saved on ${args.msg.guild.name}`;
					}
				} catch (e) {
					console.error(`[ERROR] Issue retrieving tags for server ID ${args.msg.guild.id}: ${e}`);
					compMsg = `Error retrieving tags for this server`;
				} finally {
					args.msg.author.send(compMsg);
				}
			},
		},
		{
			name: `removetag`,
			aliases: [`deletetag`, `destroytag`, `-tag`],
			usage: `RemoveTag <tagName>`,
			help: `Deletes a saved tag.`,
			func: (args) => {
				args.msg.channel.send(`tagstuff`);
			},
		},
		{
			name: `addtag`,
			aliases: [`newtag`, `tagthis`, `tagas`, `+tag`],
			usage: `AddTag <tagName> <tagString>`,
			help: `Creates a new tag.`,
			func: (args) => {
				if (args.args.length > 1) {
					let found;
					for (var i = 0; i < tags[args.msg.guild.id].length; i++) {
						if (args.args[0].toLowerCase === tags[args.msg.guild.id][i].name) {
							found = tags[args.msg.guild.id][i].name;
							break;
						}
					}
					if (found) {
						args.msg.channel.send(`That tagname is already in use on this server.`);
					} else {
						try {
							let cont = args.args;
							cont.splice(0, 1);
							tags[args.msg.guild.id].push({
								name: args.args[0].toLowerCase(),
								content: cont.join(` `),
							});
							fs.writeFileSync(JSON.stringify(tags[args.msg.guild.id]));
							args.msg.channel.send(`Tag Created`);
						} catch (e) {
							console.error(`[ERROR] Issue saving tags for server ID ${args.msg.guild.id}: ${e}`);
							args.msg.channel.send(`Error saving tags for this server`);
						}
					}
				} else {
					args.msg.channel.send(`Incorrect syntax refer to 'help addtag' for more info`);
				}
			},
		},
	],
};
