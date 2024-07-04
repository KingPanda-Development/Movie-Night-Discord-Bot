const { buildPosterMovieEmbed, movieSearchOptionsForDb, searchMovieApi } = require("../../helpers/helperFunctions.js");
const { Movie } = require("../../Models/schema");

async function postPoster(interaction) {
  const search = interaction.options.getString("search");
  const format = interaction.options.getString("format");
  const [newMovie] = await searchMovieApi(search, interaction);
  
  buildPosterMovieEmbed(interaction, newMovie, format);
}

module.exports = postPoster;