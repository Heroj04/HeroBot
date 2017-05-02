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
