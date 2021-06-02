module.exports = {
	name: 'Example',
	description: 'An example module',
	commands: [
		{
			name: 'ping',
			description: 'reply with pong',
			run: (data) => {
				// Reply pong
				data.interaction.reply('pong');
			},
		},
		{
			name: 'echo',
			description: 'Echo back whatever is sent',
			options: [
				{
					name: 'input',
					type: 'STRING',
					description: 'The input which should be echoed back',
					required: true,
				},
			],
			run: (data) => {
				// Get the input of the user
				const input = data.interaction.options[0].value;
				// Reply to the command
				data.interaction.reply(input);
			},
		},
	],
};
