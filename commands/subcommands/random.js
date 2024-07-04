const { buildSingleMovieEmbed, movieSearchOptionsForDb } = require("../../helpers/helperFunctions");
const { Movie } = require("../../Models/schema");

async function postRandomMovie(interaction) {
	//First we get total number of movies the guild has that are unviewed.
	const count = await Movie.countDocuments({ guildID: interaction.guild.id, viewed: false });
	const random = Math.floor(Math.random() * count);
	const searchOptions = movieSearchOptionsForDb(interaction.guild.id, "", true);
	//Then using a generated random number limited to the count, we find a random movie from the guilds list. If auto view is on, it will be set to viewed.
	const docs = await Movie.find(searchOptions).skip(random).limit(1);

	if (docs && docs.length) {
		const movieEmbed = buildSingleMovieEmbed(interaction, docs[0]);
		return interaction.reply({ embeds: [movieEmbed], ephemeral: true });
	} else {
		return interaction.reply({ content: "Your movie list is empty, so a random movie cannot be found.", ephemeral: true });
	}
}

module.exports = postRandomMovie;
