const { Movie } = require("../../Models/schema");
const { movieSearchOptionsForDb, buildAndPostListEmbed } = require("../../helpers/helperFunctions");

async function postViewedList (interaction) {
	let searchOptions = movieSearchOptionsForDb(interaction.guild.id, "");

	searchOptions.viewed = true;
	
	const movies = await Movie.find(searchOptions);

	if (!movies || !movies.length) {
		return interaction.reply({ content: "List of viewed movies is currently empty.", ephemeral: true });
	} else {
		return await buildAndPostListEmbed(movies, "Viewed Movies", interaction);
	}
}

module.exports = postViewedList;