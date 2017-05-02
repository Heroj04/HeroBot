module.exports = {
	moduleOptions: {
		name: `Tagging`,
		description: `Tag messages to recall later`,
		author: `Heroj04`,
		version: `1.0.0`,
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
