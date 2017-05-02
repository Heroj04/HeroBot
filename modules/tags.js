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
			args.bot.guilds.array.forEach(guild => {
				let stats = fs.statSync(`${args.library}/g${guild.id}.json`);
				if (stats === undefined) {
					fs.writeFileSync(`${args.library}/g${guild.id}.json`, `{}`);
				}
			});
		});
	},
	commands: [
		{
			name: `addtag`,
			aliases: [`newtag`, `tagthis`, `tagas`],
			help: `Creates a new tag.`,
			dm: true,
			func: (args) => {
				args.msg.channel.send(`tagstuff`);
			},
		},
	],
};
