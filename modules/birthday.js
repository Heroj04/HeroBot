module.exports = {
	name: 'Birthday',
	description: 'Send birthday messages to users',
	commands: [
		{
			name: 'birthday',
			description: 'Manage Birthdays',
			options: [
				{
					name: 'set',
					type: 'SUB_COMMAND',
					description: 'set a users birthday',
					options: [
						{
							name: 'date',
							type: 'STRING',
							description: 'The users birthday',
							required: true,
						},
						{
							name: 'user',
							type: 'USER',
							description: 'The user to set, leave blank to set yourself',
							required: false,
						},
					],
					run: (data) => {
						// Get the user (as a guild member)
						let user = data.interaction.options[0].options[1]?.member;
						if (user === undefined) {
							user = data.interaction.member;
						}

						// If the birthday string matches our date regex (https://stackoverflow.com/questions/15491894/regex-to-validate-date-format-dd-mm-yyyy)
						let dateString = data.interaction.options[0].options?.[0].value;
						if (dateString.match(/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]|(?:Jan|Mar|May|Jul|Aug|Oct|Dec)))|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2]|(?:Jan|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))))(?:(\/|-|\.)(?:1[6-9]|[2-9]\d)?\d{2})*$|^(?:29(\/|-|\.)(?:0?2|(?:Feb))(?:(\/|-|\.)(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))*)$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2])|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))(?:(\/|-|\.)(?:1[6-9]|[2-9]\d)?\d{2})*$/i)) {
							// Replace Text Months with index
							dateString
								.replace(/Jan/i, '01')
								.replace(/Feb/i, '02')
								.replace(/Mar/i, '03')
								.replace(/Apr/i, '04')
								.replace(/May/i, '05')
								.replace(/Jun/i, '06')
								.replace(/Jul/i, '07')
								.replace(/Aug/i, '08')
								.replace(/Sep/i, '09')
								.replace(/Oct/i, '10')
								.replace(/Nov/i, '11')
								.replace(/Dec/i, '12');
							// Split it up and create a Date object
							let dateSplit = dateString.split(/[-,/]/);
							// Split into dd, mm, yyyy but Date takes yyyy, mm - 1, dd
							let date = new Date(dateSplit[2] ?? 2000, dateSplit[1] - 1, dateSplit[0]);

							// Save the birthday to the store
							if (data.store[data.interaction.guildID] === undefined) data.store[data.interaction.guildID] = {};
							data.store[data.interaction.guildID][user.id] = date;

							// Reply
							data.interaction.reply(`Birthday set for <@${user.id}>`);
						} else {
							// Tell the user they used the wrong format
							data.interaction.reply('Date format incorrect, Please use "dd/mm/yyyy" or "dd/MMM/yyyy" (The year is optional)');
						}
					},
				},
				{
					name: 'remove',
					type: 'SUB_COMMAND',
					description: 'Remove a users birthday',
					options: [
						{
							name: 'input',
							type: 'USER',
							description: 'The user whos birthday to remove, leave blank to remove yourself',
							required: false,
						},
					],
					run: (data) => {
						// Get the user (as a guild member)
						let user = data.interaction.options[0].options?.[0]?.member;
						if (user === undefined) {
							user = data.interaction.member;
						}

						// Set the store
						// Remove the birthday from the store
						if (data.store[data.interaction.guildID] === undefined) data.store[data.interaction.guildID] = {};
						if (data.store[data.interaction.guildID][user.id] !== undefined) delete data.store[data.interaction.guildID][user.id];

						// Reply
						data.interaction.reply(`Birthday removed for <@${user.id}>`);
					},
				},
			],
		},
	],
};
