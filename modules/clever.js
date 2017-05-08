const fs = require(`fs`);

var key = ``;

module.exports = {
	moduleOptions: {
		name: `Clever`,
		description: `A module to interact with the Cleverbot API`,
		author: `Heroj04`,
		version: `1.0.0`,
	},
	startup: args => {
		fs.readFile(`${args.library}/key.json`, (err, data) => {
			if (err) {
				if (err.code === `ENOENT`) {
					args.log(`No key file present, creating one now. You will not have access to Cleverbot until this has been added.`, 30);
					fs.writeFile(`${args.library}/key.json`, `{apiKey: \`\`}`, (e) => {
						if (e) {
							return args.log(`Issue creating key file: ${e}`, 40);
						}
					});
					return;
				} else {
					return args.log(err, 40);
				}
			}
			let keyFile = JSON.parse(data);
			key = keyFile.apiKey;
			if (key === undefined || key === ``) {
				args.log(`No Cleverbot API Key found`, 30);
			}
		});
	},
	commands: [
		{
			name: `chat`,
			aliases: [`clever`, `talk`, `>`],
			help: `Talk with the bot`,
			usage: `Chat <Message to bot>`,
			dm: true,
			func: args => {
				args.msg.reply(`hey`);
			},
		},
	],
};
