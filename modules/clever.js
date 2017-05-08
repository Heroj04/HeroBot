const fs = require(`fs`);
const Cleverbot = require(`cleverbot.io`);

var clever;

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
					fs.writeFile(`${args.library}/key.json`, `{"apiKey": "", "apiUser": ""}`, (e) => {
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
			if (keyFile.apiKey === undefined || keyFile.apiKey === `` || keyFile.apiUser === undefined || keyFile.apiUser === ``) {
				args.log(`APIKey and/or APIUser not set, cleverbot commands will not work until these have been defined in ${args.library}/key.json.`, 40);
			} else {
				clever = new Cleverbot(keyFile.apiUser, keyFile.apiKey);
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
				if (clever === undefined) {
					args.msg.channel.send(`There is no Cleverbot API key defined, tell the admin`);
				} else if (args.args.length > 0) {
					clever.ask(args.args.join(` `), (err, reply) => {
						if (err) {
							args.log(`Issue with cleverbot api call: ${err}`, 40);
							args.msg.channel.send(`Error calling cleverbot API.`)
								.then((m) => {
									m.delete(10000);
								});
							args.msg.delete(10000);
						}
						args.msg.reply(reply);
					});
				} else {
					args.msg.reply(`Don't be shy, say something.`);
				}
			},
		},
	],
};
