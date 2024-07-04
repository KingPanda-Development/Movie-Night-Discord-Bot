const { buildSingleMovieEmbed, movieSearchOptionsForDb, searchMovieApi } = require("../../helpers/helperFunctions");
const { Movie } = require("../../Models/schema");

async function postFoundMovie(interaction) {
	const search = interaction.options.getString("search");
	const searchOptions = movieSearchOptionsForDb(interaction.guild.id, search || null);
	const movie = await Movie.findOne(searchOptions);
	
	const searchChannel = interaction.options.getChannel('channel');

	if (movie) {
		if (searchChannel !== null) {
			await interaction.reply({ content: `Movie Sent to ${searchChannel}`, ephemeral: true});
			return await searchChannel.send({ embeds: [buildSingleMovieEmbed(movie)] });
		}
		else return await interaction.reply({ embeds: [buildSingleMovieEmbed(interaction, movie)] });
	}

	const [newMovie] = await searchMovieApi(search, interaction);

	if (newMovie) {
		if (searchChannel !== null) {
			await interaction.reply({ content: `Movie Sent to ${searchChannel}`, ephemeral: true});
			return await searchChannel.send({ embeds: [buildSingleMovieEmbed(interaction, newMovie, "Movie Details (Not In Any Server List, use /add to add.)", true)] });
		}
		else return await interaction.reply({ embeds: [buildSingleMovieEmbed(interaction, newMovie, "Movie Details (Not In Any Server List, use /add to add.)", true)] });
	}
}

module.exports = postFoundMovie;