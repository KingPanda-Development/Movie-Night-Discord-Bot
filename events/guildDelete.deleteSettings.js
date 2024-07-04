const { Events } = require('discord.js');
const { Movie, Setting } = require("../Models/schema");
const c = require("ansi-colors");

module.exports = {
	name: Events.GuildDelete,
	async execute(guild) {
		// Poor people might lose all their movies
		// Movie.deleteMany({ guildID: guild.id }).catch(handleError);
		Setting.deleteMany({ guildID: guild.id }).catch(handleError);
	},
};

function handleError(err, message) {
	if (err) {
		console.error(c.red(message, err));
	}
}