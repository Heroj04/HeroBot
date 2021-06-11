const Scryfall = require('scryfall-client');

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
				// Defer the interaction while we load card info
				data.interaction.defer();

				// Get options
				let search = data.interaction.options[0].value;
				let idType = data.interaction.options[1]?.value;
				if (idType === undefined) {
					// Work out what the user provided
					if (search.match(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/i)) {
						// Is a scryfall ID
						idType = 'scryfall';
					} else if (search.match(/^\d{1,6}$/)) {
						// Some sort of other ID, Assume Multiverse ID
						idType = 'multiverse';
					} else {
						// Assume Fuzzy Name
						idType = 'fuzzyName';
					}
				}

				// Search Scryfall
				Scryfall.getCard(search, idType)
					.then(card => {
						// Found a card
						// Build the description
						let description = '';
						let fields = [];
						if (typeof card.card_faces !== 'undefined' && card.card_faces.length > 1) {
							for (const face of card.card_faces) {
								let faceDescription = face.type_line;
								if (typeof face.oracle_text !== 'undefined') faceDescription += `\n${face.oracle_text}`;
								if (typeof face.power !== 'undefined' && typeof face.toughness !== 'undefined') faceDescription += `\n${face.power}/${face.toughness}`;
								if (typeof face.loyalty !== 'undefined') faceDescription += `\nloyalty: ${face.loyalty}`;
								fields.push({
									name: `${face.name} | ${face.mana_cost}`,
									value: faceDescription,
								});
							}
						} else {
							description += `${card.type_line}`;
							if (typeof card.oracle_text !== 'undefined') description += `\n${card.oracle_text}`;
							if (typeof card.power !== 'undefined' && typeof card.toughness !== 'undefined') description += `\n${card.power}/${card.toughness}`;
							if (typeof card.loyalty !== 'undefined') description += `\nloyalty: ${card.loyalty}`;
						}

						data.interaction.followUp({
							embeds: [{
								title: `${card.name} | ${card.mana_cost}`,
								description: description,
								fields: fields,
								thumbnail: {
									url: card.image_uris.small,
								},
								url: card.scryfall_uri,
							}],
						});
					})
					.catch(reason => {
						// Failed to Find
						console.log(`Failed to find card (${search}, ${idType}): ${reason}`);
						data.interaction.followUp(`Sorry, I couldn't find that card`);
					});
			},
		},
	],
};
