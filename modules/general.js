module.exports = {
	moduleOption: {
		name: `General`,
		description: `A module featuring basic bot commands`,
		author: `Heroj04`,
		version: `1.0.0`,
	},
	commands: [
		{
			name: `help`,
			aliases: [`halp`, `?`],
			help: `Displays help information for commands and modules.`,
			usage: 'Help <command or module>',
			dm: true,
			func: (args) => {
				args.msg.author.send();
			},
		},
		{
			name: `about`,
			aliases: [`info`],
			help: `Displays information about the bot`,
			dm: true,
			func: (args) => {
				args.msg.author.send();
			},
		},
	],
};
