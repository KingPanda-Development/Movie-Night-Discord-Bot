const { Movie } = require("../../Models/schema");
const { movieSearchOptionsForDb, buildAndPostListEmbed } = require("../../helpers/helperFunctions");

async function postUnviewedList(interaction) {
	let searchOptions = movieSearchOptionsForDb(interaction.guild.id, "", true);

	const movies = await Movie.find(searchOptions);
	
	if (!movies || !movies.length) {
		return interaction.reply({ content: "List of unviewed movies is currently empty.", ephemeral: true });
	} else {
		return await buildAndPostListEmbed(movies, "Unviewed Movies", interaction);
	}
}

module.exports = postUnviewedList;