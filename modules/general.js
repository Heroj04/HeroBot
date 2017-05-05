module.exports = {
	moduleOptions: {
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
			usage: 'Help [command or module]',
			dm: true,
			func: (args) => {
				let compMsg;
				if (args.args.length > 0) {
					let cmdString = args.args[0].toLowerCase();
					let found = false;
					let modName = ``;
					for (var i = 0; i < args.modules.length; i++) {
						for (var j = 0; j < args.modules[i].commands.length; j++) {
							if (cmdString === args.modules[i].commands[j].name || args.modules[i].commands[j].aliases.indexOf(cmdString) >= 0) {
								found = args.modules[i].commands[j];
								modName = args.modules[i].moduleOptions.name;
								break;
							}
						}
						if (found) {
							break;
						}
					}
					if (found) {
						compMsg = `--- ${found.name} Help ---`;
						compMsg += `\n~${modName}~`;
						compMsg += `\nAliases: `;
						found.aliases.forEach(alias => {
							compMsg += `${alias} `;
						});
						compMsg += `\nUsage: ${found.usage}`;
						compMsg += `\n\n${found.help}`;
					} else {
						compMsg = `Sorry, that command doesn't seem to exist`;
					}
				} else {
					compMsg = `--- Available Commands ---`;
					args.modules.forEach(module => {
						compMsg += `\n\n~${module.moduleOptions.name}~\n${module.moduleOptions.description}`;
						module.commands.forEach(command => {
							compMsg += `\n - ${command.name}`;
						});
					});
				}
				args.msg.author.send(compMsg);
				args.msg.delete(5000);
			},
		},
		{
			name: `about`,
			aliases: [`info`],
			help: `Displays information about the bot`,
			dm: true,
			func: (args) => {
				args.msg.channel.send(`I am Radiobot, a Discord bot built by Heroj04 (@jackrfootner).\nMy Source code is available at www.github.com/Heroj04/Radiobot`);
			},
		},
		{
			name: `eval`,
			aliases: [`evaluate`, `parse`, `js`, `script`],
			help: `Executes provided scripts as the bot`,
			usage: `Eval <script>`,
			dm: true,
			owner: true,
			func: (args) => {
				let script = args.args.join[` `];
				try {
					args.log(`Eval command running script: ${script}`, 30);
					let complete = eval(script);
					args.msg.channel.send(`Script completed, returned: ${complete}`);
				} catch (e) {
					args.msg.channel.send(`Script failed, error: ${e}`);
				}
			},
		},
		{
			name: `listids`,
			aliases: [`ids`],
			help: `Lists the IDs of users and channels in this guild.`,
			func: (args) => {
				let compMsg = `Guild ID: ${args.msg.guild.id}`;
				let textChannels = args.msg.guild.channels.filter((channel, index, array) => channel.type === `text`);
				let voiceChannels = args.msg.guild.channels.filter((channel, index, array) => channel.type === `voice`);
				compMsg += `\n\n~Text Channels~`;
				textChannels.forEach(channel => {
					compMsg += `\n${channel.name} ID: ${channel.id}`;
				});
				compMsg += `\n\n~Voice Channels~`;
				voiceChannels.forEach(channel => {
					compMsg += `\n${channel.name} ID: ${channel.id}`;
				});
				args.msg.author.send(compMsg);
				args.msg.delete(5000);
			},
		},
	],
};
