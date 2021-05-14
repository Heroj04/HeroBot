module.exports = {
	name: 'Example',
	description: 'An example module',
	commands: [
		{
			name: 'ping',
			description: 'responds with pong',
			alias: [
				'pang',
				'pung',
			],
			run: (message) => 'pong',
			subCommands: [
				{
					name: 'ping',
					description: 'responds with pong pong',
					run: (message) => 'pong pong',
				},
			],
		},
		{
			name: 'foo',
			description: 'responds with bar',
			run: (message) => 'bar',
			subCommands: [
				{
					name: 'foo',
					description: 'responds with bar bar',
					alias: [
						'fab',
					],
					run: (message) => 'bar bar',
				},
			],
		},
	],
};
