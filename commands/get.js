const { SlashCommandBuilder, ChannelType } = require("discord.js");
const postViewedList = require("./subcommands/viewed");
const postUnviewedList = require("./subcommands/unviewed");
const postRandomMovie = require("./subcommands/random");
const postFoundMovie = require("./subcommands/fetch");
const postPoster = require("./subcommands/poster");
const c = require("ansi-colors");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("get")
		.setDescription("Everything related to fetching movies.")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("movie")
				.setDescription("Lookup movie details from unviewed and movies or from online without adding.")
				.addStringOption((option) =>
					option
					.setName("search")
					.setDescription("Movie to search for, Able to use IMDB link.")
					.setRequired(true)
					.setAutocomplete(true)
				)
				.addChannelOption(option =>
					option
						.setName('channel')
						.setDescription('Select a channel')
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(false)
				)
		)
		.addSubcommand((subcommand) => subcommand.setName("random").setDescription("Get a random movie from your unviewed list.")) // Get one from unviewed
		.addSubcommand((subcommand) => subcommand.setName("viewed-list").setDescription("Gets list of all servers viewed movies.")) // Search options viewed only
		.addSubcommand((subcommand) => subcommand.setName("unviewed-list").setDescription("Gets list of all servers unviewed movies.")) // Search options unviewed only
		.addSubcommand((subcommand) =>
			subcommand
				.setName("poster")
				.setDescription("Get a poster of the movie.")
				.addStringOption((option) =>
					option
					.setName("search")
					.setDescription("Movie to search for, Able to use IMDB link.")
					.setRequired(true)
					.setAutocomplete(true)
				)
				.addStringOption((option) =>
					option
					.setName("format")
					.setDescription("Format of the poster.")
					.setChoices([
						{ name: "Format [ JPEG ]", value: "jpeg" },
						{ name: "Format [ JPG ]", value: "jpg" },
						{ name: "Format [ PNG ]", value: "png" },
						{ name: "Format [ WEBP ]", value: "webp" }
					])
					.setRequired(true)
				)
		),
	async execute(interaction) {
			const subCommand = interaction.options.getSubcommand();
	
			if (subCommand == "random") {
				return await postRandomMovie(interaction);
			}
	
			if (subCommand == "viewed-list") {
				return await postViewedList(interaction);
			}
	
			if (subCommand == "unviewed-list") {
				return await postUnviewedList(interaction);
			}
	
			if (subCommand == "movie") {
				return await postFoundMovie(interaction);
			}

			if (subCommand == "poster") {
				return await postPoster(interaction);
			}
	},
	async autoComplete(interaction) {
		const searchQuery = interaction.options.getString('search');
		if (!searchQuery) return;
	
		try {
				const movielist = require('../config & JSON/movieNameList.json');
				const filtered = movielist.name.filter(movie => movie.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,25);

				await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
		} catch (error) {
				console.error(`〔 Get.js 〕➜ Failed to read database:`, c.red(error));
				return [];
		}
	}
};