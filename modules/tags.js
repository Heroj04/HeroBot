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
				try {
					tags[guilds[i].id] = JSON.parse(fs.readFileSync(`${args.library}/${guilds[i].id}.json`));
				} catch (e) {
					if (e.code === `ENOENT`) {
						fs.writeFileSync(`${args.library}/${guilds[i].id}.json`, `[]`);
						tags[guilds[i].id] = [];
					} else {
						try {
							fs.rmdirSync(`${args.library}/${guilds[i].id}.json`);
							fs.writeFileSync(`${args.library}/${guilds[i].id}.json`, `[]`);
							tags[guilds[i].id] = [];
						} catch (error) {
							args.log(`Issue creating/reading tag files: ${error}`, 40);
						}
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
							if (args.args[0].toLowerCase() === tags[args.msg.guild.id][i].name) {
								found = tags[args.msg.guild.id][i];
								break;
							}
						}
						if (found) {
							args.msg.channel.send(found.content);
						} else {
							args.msg.channel.send(`Sorry, that tag doesn't seem to exist.`)
								.then(m => {
									m.delete(10000);
								});
							args.msg.delete(10000);
						}
					} catch (e) {
						args.log(`Issue retrieving tags for server ID ${args.msg.guild.id}: ${e}`, 40);
						args.msg.channel.send(`Error retrieving tags for this server.`)
							.then(m => {
								m.delete(10000);
							});
						args.msg.delete(10000);
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
					args.log(`Issue retrieving tags for server ID ${args.msg.guild.id}: ${e}`, 40);
					compMsg = `Error retrieving tags for this server`;
				} finally {
					args.msg.author.send(compMsg);
					args.msg.delete(5000);
				}
			},
		},
		{
			name: `removetag`,
			aliases: [`deletetag`, `destroytag`, `-tag`],
			usage: `RemoveTag <tagName>`,
			help: `Deletes a saved tag.`,
			func: (args) => {
				if (args.args.length > 0) {
					let found = false;
					for (var i = 0; i < tags[args.msg.guild.id].length; i++) {
						if (args.args[0].toLowerCase() === tags[args.msg.guild.id][i].name) {
							try {
								tags[args.msg.guild.id].splice(i, 1);
								fs.writeFileSync(`${args.library}/${args.msg.guild.id}.json`, JSON.stringify(tags[args.msg.guild.id]));
								args.msg.channel.send(`Tag Removed`)
									.then(m => {
										m.delete(10000);
									});
								args.msg.delete(10000);
							} catch (e) {
								args.log(`Issue saving tags for server ID ${args.msg.guild.id}: ${e}`, 40);
								args.msg.channel.send(`Error saving tags for this server`)
									.then(m => {
										m.delete(10000);
									});
								args.msg.delete(10000);
							}
							found = true;
							break;
						}
					}
					if (!found) {
						args.msg.channel.send(`Sorry, that tagname doesn't seem to exist on this server.`)
							.then(m => {
								m.delete(10000);
							});
						args.msg.delete(10000);
					}
				} else {
					args.msg.channel.send(`Incorrect syntax refer to 'help removetag' for more info`);
				}
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
						if (args.args[0].toLowerCase() === tags[args.msg.guild.id][i].name) {
							found = tags[args.msg.guild.id][i].name;
							break;
						}
					}
					if (found) {
						args.msg.channel.send(`That tagname is already in use on this server.`)
							.then(m => {
								m.delete(10000);
							});
						args.msg.delete(10000);
					} else {
						try {
							tags[args.msg.guild.id].push({
								name: args.args[0].toLowerCase(),
								content: args.args.splice(1, args.args.length - 1).join(` `),
							});
							fs.writeFileSync(`${args.library}/${args.msg.guild.id}.json`, JSON.stringify(tags[args.msg.guild.id]));
							args.msg.channel.send(`Tag Created`)
								.then(m => {
									m.delete(10000);
								});
							args.msg.delete(10000);
						} catch (e) {
							args.log(`Issue saving tags for server ID ${args.msg.guild.id}: ${e}`, 40);
							args.msg.channel.send(`Error saving tags for this server`)
								.then(m => {
									m.delete(10000);
								});
							args.msg.delete(10000);
						}
					}
				} else {
					args.msg.channel.send(`Incorrect syntax refer to 'help addtag' for more info`);
				}
			},
		},
	],
};
