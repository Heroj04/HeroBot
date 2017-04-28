const Discord = require(`discord.js`);

var bot = new Discord.Client();

function initialise() {
	// Do things to set up the bot
}

bot.on(`ready`, () => {
	initialise();
});

bot.on(`message`, (msg) => {

});

bot.login(/*token*/)
	.then(() => {
		// Bot has successfully logged in to discord
	})
	.catch((err) => {
		console.log(`[ERROR] Issue Logging in: ${err}`);
	});
