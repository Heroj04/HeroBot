const fs = require(`fs`);

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
					if (!stats.isFile()) {
						throw new Error(`Not a file`);
					}
				} catch (e) {
					if (e.code === `ENOENT`) {
						fs.writeFileSync(`${args.library}/${guilds[i].id}.json`, `[]`);
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
				args.msg.channel.send(`tagstuff`);
			},
		},
		{
			name: `taglist`,
			aliases: [`tags`, `displaytags`, `showtags`],
			help: `Displays a list of saved tags.`,
			func: (args) => {
				let compMsg;
				try {
					let tags = JSON.parse(fs.readFileSync(`${args.library}/${args.msg.guild.id}.json`));
					if (tags.length > 0) {
						compMsg = `Tags for ${args.msg.guild.name}`;
						for (var i = 0; i < tags.length; i++) {
							compMsg += `\n - ${tags[i].name}`;
						}
					} else {
						compMsg = `There are no tags saved on ${args.msg.guild.name}`;
					}
				} catch (e) {
					console.error(`[ERROR] Issue reading tags for server ID ${args.msg.guild.id}: ${e}`);
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
				args.msg.channel.send(`tagstuff`);
			},
		},
	],
};
