const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require("discord.js");
const { Movie } = require("../Models/schema");
const { movieSearchOptionsForDb, buildSingleMovieEmbed } = require("../helpers/helperFunctions");
const c = require("ansi-colors");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("set")
		.setDescription("Allows setting movie to watched or unwatched")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("viewed")
				.setDescription("Set movie to Viewed")
				.addStringOption((option) => option.setName("movie").setDescription("Do /get unviewed-list to see your movie name for set to viewed.").setRequired(true))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("unviewed")
				.setDescription("Set movie to Unviewed")
				.addStringOption((option) => option.setName("movie").setDescription("Do /get unviewed-list to see your movie name for set to unviewed.").setRequired(true))
		),
	async execute(interaction, settings) {
		const movieSearch = interaction.options.getString("movie");
		const searchOptions = movieSearchOptionsForDb(interaction.guild.id, movieSearch);
		const movie = await Movie.findOne(searchOptions);
		const viewedCommand = interaction.options.getSubcommand() == "viewed";
		const option = viewedCommand ? "Viewed" : "Unviewed";

		if (!movie) {
			return interaction.reply({ content: "Movie could not be found!", ephemeral: true });
		} else if ((settings.viewedMoviesRole && (interaction.member.roles.cache.has(settings.viewedMoviesRole) || settings.viewedMoviesRole == "all")) || interaction.member.permissions.has("Administrator")) {
			if ((movie.viewed && viewedCommand) || (!movie.viewed && !viewedCommand)) {
				return interaction.reply({ content: `${movie.name} is already set to ${option}`, ephemeral: true });
			}

			const collectorFilter = (i) => i.user.id === interaction.user.id;
			const confirm = new ButtonBuilder().setCustomId("confirm").setLabel(`Set to ${option}?`).setStyle(ButtonStyle.Primary);
			const cancel = new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger);
			const row = new ActionRowBuilder().addComponents(confirm, cancel);
			const movieEmbed = buildSingleMovieEmbed(interaction, movie, `Are you sure you want to set \`${movie.name}\` to **${option}**?`);
			const reply = await interaction.reply({ embeds: [movieEmbed], components: [row] });

			try {
				const confirmation = await reply.awaitMessageComponent({ collectorFilter, time: 30000 });

				if (confirmation.customId === "confirm") {
					await movie.updateOne({ viewed: !movie.viewed, viewedDate: movie.viewed ? null : new Date() });
					reply.delete().catch((error) => {
						console.log(c.grey("〔 SetViewedState.js 〕➜ Message deleted"));
					})
					return await interaction.followUp({ content: `\`${movie.name}\` has been set to **${option}**!`, ephemeral: true });
				} else if (confirmation.customId === "cancel") {
					reply.delete().catch((error) => {
						console.log(c.grey("〔 SetViewedState.js 〕➜ Message deleted"));
					})
					return await interaction.followUp({ content: `\`${movie.name}\` has NOT been set to **${option}**.`, ephemeral: true });
				}
			} catch (e) {
				reply.delete().catch((error) => {
					console.log(c.grey("〔 SetViewedState.js 〕➜ Message deleted"));
				})
				return await interaction.followUp({ content: "Confirmation not received within 30 Seconds, cancelling command.", ephemeral: true });
			}
		} else {
			return interaction.reply({ content: "Non-administrators can only set viewed if viewedrole has been set to all or a specific role.", ephemeral: true });
		}
	},
};