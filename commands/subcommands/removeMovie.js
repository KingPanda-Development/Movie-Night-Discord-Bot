const emojis = require("../../config & JSON/emojis.json");
const { Movie } = require("../../Models/schema");
const { movieSearchOptionsForDb } = require("../../helpers/helperFunctions");
const c = require("ansi-colors");

async function removeMovie(interaction, settings) {
	const movieSearch = interaction.options.getString("search");
	const searchOptions = movieSearchOptionsForDb(interaction.guild.id, movieSearch, true);

	//If submitted film is by member trying to delete, allow it.
	if (movieSearch) {
		return Movie
			.findOne(searchOptions)
			.then(async (movie) => {
				if (
					"<@" + interaction.member.user.id + ">" === movie.submittedBy ||
					(settings.deleteMoviesRole && (interaction.member.roles.cache.has(settings.deleteMoviesRole) || settings.deleteMoviesRole == "all")) ||
					interaction.member.permissions.has("Administrator")
				) {
					return await interaction.reply({ content: `Are you sure you want to delete ${movie.name}?` }).then(async (msgs) => {
						const botMessage = await interaction.fetchReply();
						const filter = (reaction, user) => [emojis.yes, emojis.no].includes(reaction.emoji.name) && user.id == interaction.member.id;

						try {
							await botMessage.react(emojis.yes);
							await botMessage.react(emojis.no);
						} catch (e) {
							console.log(c.grey("〔 RemoveMovie.js 〕➜ Message deleted"));
						}

						//Wait for user to confirm if movie presented to them is what they wish to be added to the list or not.
						return botMessage
							.awaitReactions({ filter: filter, max: 1, time: 30000, errors: ["time"] })
							.then(async (collected) => {
								const reaction = collected.first();

								if (reaction.emoji.name == emojis.yes) {
									await movie.deleteOne();
									msgs.delete().catch((error) => {
										console.log(c.grey("〔 RemoveMovie.js 〕➜ Message deleted"));
									})
									
									return interaction.followUp({ content: `**Movie deleted:** \`${movie.name}\``, ephemeral: true });
								} else {
									msgs.delete().catch((error) => {
										console.log(c.grey("〔 RemoveMovie.js 〕➜ Message deleted"));
									})
									return interaction.followUp({ content: `${movie.name} has not been deleted.`, ephemeral: true });
								}
							})
							.catch(async () => {
								msgs.delete().catch((error) => {
									console.log(c.grey("〔 RemoveMovie.js 〕➜ Message deleted"));
								})
								return interaction.followUp({ content: "Couldn't get your response.", ephemeral: true });
							});
					});
				} else {
					return interaction.reply({ content: "Non-administrators can only delete movies they have submitted, unless deleterole has been set to all or a specific role.", ephemeral: true });
				}
			})
			.catch(async () => {
				return interaction.reply({ content: "Movie could not be found! It may be in the viewed list. Use removeviewed instead.", ephemeral: true });
			});
	} else {
		return interaction.reply({ content: "Specify a movie or remove space.", ephemeral: true });
	}
}

module.exports = removeMovie;