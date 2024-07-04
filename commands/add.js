const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const emojis = require("../config & JSON/emojis.json");
const { buildSingleMovieEmbed, searchMovieApi } = require("../helpers/helperFunctions");
const c = require("ansi-colors");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("add")
		.setDescription("Adds movie to the servers list for movies to vote on and view.")
		.addStringOption((option) =>
			option
				.setName("moviename")
				.setDescription("Movie to search for to add to unviewed list. Able to use IMDB link.")
				.setRequired(true)
				.setAutocomplete(true)
		),
	async execute(interaction, settings) {
		const search = interaction.options.getString("moviename");

		//Check if user has set a role for "Add" permissions, as only admins and this role will be able to add movies if set.
		if (settings.addMoviesRole && !interaction.member.roles.cache.has(settings.addMoviesRole) && !interaction.member.permissions.has("ADMINISTRATOR")) {
			return interaction.reply({ content: "Non-administrators can only add movies if they have specified role in addMoviesRole has cleared or a specific role by an administrator.", ephemeral: true });
		}

		//Continue with normal search if the above doesnt return.
		const [newMovie, data] = await searchMovieApi(search, interaction);

		//No need for else, searchNewMovie alerts user if no movie found.
		if (newMovie) {
			try {
				await newMovie.save();
			} catch (err) {
				return interaction.reply({ content: `\`${newMovie.name}\` Movie already exists in the list. It may be marked as 'Viewed'`, ephemeral: true });
			}

			//If the search results from the API returned more than one result, we ask the user to confirm using REACTIONS on the message.
			const movieEmbed = buildSingleMovieEmbed(interaction, newMovie, "Is this the movie you want to add?");

			const yesButton = new ButtonBuilder().setEmoji(emojis.yes).setStyle(ButtonStyle.Success).setCustomId("yes-button")
			const noButton = new ButtonBuilder().setEmoji(emojis.no).setStyle(ButtonStyle.Danger).setCustomId("no-button")
			const buttonRow = new ActionRowBuilder().addComponents(yesButton, noButton);

			return interaction.reply({ embeds: [movieEmbed], components: [buttonRow] }).then(async (movieReply) => {
				const embedMessage = await interaction.fetchReply();
				const filter = (i) => i.user.id === interaction.user.id;

				const collector = embedMessage.createMessageComponentCollector({ filter: filter, time: 30000 });

				//Wait for user to confirm if movie presented to them is what they wish to be added to the list or not.
				collector.on("collect", async(interaction) => {
					if (interaction.customId === "yes-button") {
						await collector.stop();
						movieReply.delete().catch((error) => {
							console.log(c.grey("〔 Add.js 〕➜ Message deleted"));
						})
						return interaction.reply({ content: `\`${newMovie.name}\` Movie will be added to the list!`, ephemeral: true });
					}
					else if (interaction.customId === "no-button") {
						await collector.stop();
						movieReply.delete().catch((error) => {
							console.log(c.grey("〔 Add.js 〕➜ Message deleted"));
						})
						await interaction.reply({ content: `\`${newMovie.name}\` Movie will not be added to the list. Try using an IMDB link instead?`, ephemeral: true });
						return await newMovie.deleteOne().catch(() => {});
					}
				})

				collector.on("end", async(interaction) => {
					await collector.stop();
					if (interaction.size !== 1) {
						movieReply.delete().catch((error) => {
							console.log(c.grey("〔 Add.js 〕➜ Message deleted"));
						})
						await interaction.reply({ embeds: `\`${newMovie.name}\` Movie will not be added, you didn't respond in time. Try using an IMDB link instead?`, ephemeral: true });
						return await newMovie.deleteOne().catch(() => {});
					}
				})
			})
		}
	},
	async autoComplete(interaction) {
		const SearchQuery = interaction.options.getString("moviename");
		if (!SearchQuery) return;
		try {
				const movielist = require('../config & JSON/movieNameList.json');
				const filtered = movielist.name.filter(movie => movie.toLowerCase().includes(SearchQuery.toLowerCase())).slice(0,25);

				await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
		} catch (error) {
				console.error("〔 Add.js 〕➜ Failed to read database:", c.red(error));
				return [];
		}
	}
};