var scryfall = require('scryfall-client');

module.exports = {
	name: 'Magic: The Gathering Tools',
	description: 'A series of MTG tools',
	commands: [
		{
			name: 'generate-proxy',
			description: 'Generate a custom card proxy',
			run: (data) => {
				// Reply to the command
				data.interaction.reply('Not yet Implemented');
			},
		},
		{
			name: 'card-search',
			description: 'Search for card info from Scryfall',
			options: [
				{
					name: 'name-or-id',
					type: 'STRING',
					description: 'The card name to search for, or the ID to lookup',
					required: true,
				},
				{
					name: 'id-type',
					type: 'STRING',
					description: 'The type of ID provided',
					required: false,
					choices: [
						{
							name: 'Scryfall',
							value: 'scryfall',
						},
						{
							name: 'Multiverse',
							value: 'multiverse',
						},
						{
							name: 'Arena',
							value: 'arena',
						},
						{
							name: 'MTG: Online',
							value: 'mtgo',
						},
						{
							name: 'TCG Player ID',
							value: 'tcg',
						},
						{
							name: 'Fuzzy Name',
							value: 'fuzzyName',
						},
						{
							name: 'Exact Name',
							value: 'exactName',
						},
					],
				},
			],
			run: (data) => {
				// Reply to the command
				data.interaction.reply('Not yet Implemented');
			},
		},
	],
};
