const axios = require("axios");
const { movieDbAPI } = process.env;
const { Movie } = require("../Models/schema");
const moment = require("moment");
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, AttachmentBuilder, MessagePayload } = require("discord.js");
const emojis = require("../config & JSON/emojis.json");
const c = require("ansi-colors");
const languageChanges = require("../config & JSON/language.json");
const countryChanges = require("../config & JSON/country.json");

function embedColors(inter) {
	return "Blurple";
}

async function searchMovieApi(search, message) {
	let failedSearch = false;
	let data = false;
	let isImdbSearch = search.includes("imdb.com");
	let searchTerm = isImdbSearch ? search.match(/tt[0-9]{7,8}/g) : search;
	let genreMovie = [];

	if (!searchTerm) {
		await message.reply({ content: "Please enter a valid search.", ephemeral: true });

		return;
	}

	//If not a IMDB link, do a general search else we use a different endpoint.
	let initialData = await (!isImdbSearch
		? axios
				.get(
					`https://api.themoviedb.org/3/search/movie?api_key=${movieDbAPI}&query=${encodeURIComponent(searchTerm)}&page=1`,
				)
				.then((response) => response.data)
		: axios
				.get(
					`https://api.themoviedb.org/3/find/${encodeURIComponent(searchTerm)}?api_key=${movieDbAPI}&external_source=imdb_id`,
				)
				.then((response) => response.data));

	failedSearch =
		!initialData ||
		initialData.total_results == 0 ||
		(initialData.movie_results && initialData.movie_results.length == 0);

	//Get the FIRST result from the initial search
	if (!failedSearch) {
		data = await axios
			.get(
				`https://api.themoviedb.org/3/movie/${isImdbSearch ? initialData.movie_results[0].id : initialData.results[0].id}?api_key=${movieDbAPI}`,
			)
			.then((response) => response.data);
	}

	if (!data || failedSearch || data.success == "false") {
		await message.reply({ content: "Couldn't find any movies. Sorry!", ephemeral: true });

		return [null, data];
	}
	
	data.genres.forEach(genre => genreMovie.push(genre.name));

	const fullOriginalLanguageNamesWithEmoji = getLanguageEmojiWithName(data.original_language);
	const fullLanguageNamesWithEmoji = data.spoken_languages.map(language => getLanguageEmojiWithName(language.iso_639_1));
	const companyName = data.production_companies.map(company => company.name);
	
	let movie = new Movie({
		primaryKey: message.guild.id + data.id,
		guildID: message.guild.id,
		movieID: data.id,
		imdbID: data.imdb_id,
		adult: data.adult,
		name: data.title || data.original_title,
		revenue: data.revenue.toLocaleString(),
		posterURL: `https://image.tmdb.org/t/p/original/${data.poster_path}`,
		homepage: data.homepage,
		overview: data.overview,
		tagline: data.tagline,
		genres: genreMovie.join(", "),
		from: formatProductionCountries(data.production_countries).join(", "),
		language: fullOriginalLanguageNamesWithEmoji,
		spoken_languages: fullLanguageNamesWithEmoji.join(", "),
		runtime: data.runtime,
		budget: formatBudget(data.budget),
		rating: data.vote_average, // pakai .toFixed(1) biar jadi angka desimal kek 7.259 jadi 7.3
		ratingCount: data.vote_count.toLocaleString(),
		popularity: data.popularity,
		production_companies: companyName.join(", "),
		submittedBy: message.member.user, //message.author.id - Update to this after creating mongoDB migration and API for dashboard can be rolled out.
	});

	if (isNaN(data.release_date)) {
		movie.releaseDate = new Date(data.release_date);
	}

	return [movie, initialData];
}

function movieSearchOptionsForDb(guildID, movie, hideViewed) {
	let isImdbSearch = movie.includes("imdb.com");
	let searchObj = {
		guildID: guildID,
	};

	// If Movie is array, do regex for every item
	if (isImdbSearch) {
		searchObj.imdbID = movie.match(/tt[0-9]{7,8}/g);
	} else if (movie) {
		searchObj.name = new RegExp(".*" + movie + ".*", "i");
	}

	if (hideViewed) {
		searchObj.viewed = false;
	}

	return searchObj;
}

function buildSingleMovieEmbed(interaction, movie, subtitle, hideSubmitted) {
	// Font Math Italic = https://tools.picsart.com/text/font-generator/
	const emojimovie = "<:MovieClapper:1255797578080059467>";
	const embed = new EmbedBuilder()
		.setTitle(movie.name)
		.setURL(movie.homepage || `https://www.imdb.com/title/${movie.imdbID}`)
		.setDescription(movie.overview || "No description.")
		.setThumbnail(movie.posterURL)
		.setColor(embedColors(interaction))
	
		if (movie.tagline.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑻𝒂𝒈𝑳𝒊𝒏𝒆\n» ` + movie.tagline || "unknown", inline: true }]);
		}
	
		if (movie.genres.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑮𝒆𝒏𝒓𝒆\n» ` + movie.genres || "unknown", inline: true }]);
		}
	
		if (movie.from.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑭𝒊𝒍𝒎 𝑭𝒓𝒐𝒎\n» ` + movie.from || "unknown", inline: true }]);
		}

		if (movie.language.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭**\u200B𝑳𝒂𝒏𝒈𝒖𝒂𝒈𝒆\n» ` + movie.language || "unknown", inline: true }]);
		}

		if (movie.spoken_languages.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑺𝒑𝒐𝒌𝒆𝒏 𝑳𝒂𝒏𝒈𝒖𝒂𝒈𝒆\n» ` + movie.spoken_languages || "unknown", inline: true }]);
		}

		if (movie.runtime.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑹𝒖𝒏 𝑻𝒊𝒎𝒆\n» ` + `${movie.runtime} Minutes` || "unknown", inline: true }]);
		}
	
		if (movie.budget.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑩𝒖𝒅𝒈𝒆𝒕\n» ` + movie.budget || "unknown", inline: true }]);
		}

		if (movie.revenue.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑹𝒆𝒗𝒆𝒏𝒖𝒆\n» ` + movie.revenue || "unknown", inline: true }]);
		}

		if (movie.rating && movie.ratingCount.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑹𝒂𝒕𝒊𝒏𝒈𝒔\n» ` + `${movie.rating} (${movie.ratingCount} votes)` || "unknown", inline: true }]);
		}

		if (movie.popularity.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑷𝒐𝒑𝒖𝒍𝒂𝒓𝒊𝒕𝒚\n» ` + `${movie.popularity}` || "unknown", inline: true }]);
		}

		if (movie.production_companies.length >= 1) {
			embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑷𝒓𝒐𝒅𝒖𝒄𝒕𝒊𝒐𝒏 𝑪𝒐𝒎𝒑𝒂𝒏𝒊𝒆𝒔\n» ` + movie.production_companies || "unknown", inline: true }]);
		}

		let viewedDateString = "Have Not Yet Viewed";
		if (movie.viewed === true) viewedDateString = `Have Viewed On **${moment(movie.viewedDate).format("DD MMM YYYY")}**`;
		embed.addFields([{ name: `_ _`, value: `**${emojimovie}➭** \u200B𝑽𝒊𝒆𝒘𝒆𝒅\n» ` + viewedDateString, inline: true }]);

		if (!hideSubmitted) {
			embed.addFields([
				{
					name: `_ _`,
					value: `**${emojimovie}➭** \u200B𝑺𝒖𝒃𝒎𝒊𝒕𝒕𝒆𝒅 𝑩𝒚\n» ` + movie.submittedBy + " / **" + moment(movie.submitted).format("DD MMM YYYY") + "**" || "unknown",
					inline: true
				}
			]);
		}
	
	if (subtitle) {
		embed.setAuthor({ name: subtitle });
	}

	embed.setFooter({
		iconURL: null,
		text: `\u200BRelease Date - ${moment(movie.releaseDate).format("DD MMM YYYY")}` || "unknown"
	});
	
	return embed;
}

function buildPosterMovieEmbed(interaction, movie, format) {
	let confirmFormat = "";
	if (format == "jpeg") confirmFormat = "image/jpeg";
	if (format == "jpg") confirmFormat = "image/jpg";
	if (format == "png") confirmFormat = "image/png";
	if (format == "webp") confirmFormat = "image/webp";
	
	const NotSupportEmbed = new EmbedBuilder()
	.setTitle(movie.name)
	.setURL(movie.homepage || `https://www.imdb.com/title/${movie.imdbID}`)
	.setDescription("The image of \`" + movie.name + "\` movie is doesn't support!!")
	.setColor(embedColors(interaction))
	if (movie.posterURL === "https://image.tmdb.org/t/p/original/null") return interaction.reply({ embeds: [NotSupportEmbed] })
		
	const attachment = new AttachmentBuilder(movie.posterURL, { name: `posterMovie.${format}`, contentType: confirmFormat });
	
	const embed = new EmbedBuilder()
		.setTitle(movie.name)
		.setURL(movie.homepage || `https://www.imdb.com/title/${movie.imdbID}`)
		.setDescription("As your requested, here is the poster of the movie \`" + movie.name + "\`")
		.setImage(`attachment://posterMovie.${format}`)
		.setColor(embedColors(interaction))

	embed.setFooter({
		iconURL: null,
		text: `\u200BRelease Date - ${moment(movie.releaseDate).format("DD MMM YYYY")}` || "unknown"
	});

	return interaction.reply({ embeds: [embed], files: [attachment], ephemeral: true }).then(async (m) => {
		const fetchs = await interaction.fetchReply();
		const attachmentURL = fetchs.embeds[0].image.url;
		
		const row = new ActionRowBuilder()
		.addComponents(
				new ButtonBuilder()
						.setLabel(`Download ${capitalizeFirstLetterOnly(format)}`)
						.setStyle('Link')
						.setURL(attachmentURL)
		);
		m.edit({ components: [row] });
	})
}

function capitalizeFirstLetterOnly(str) {
		if (str.length === 0) return str;

		return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRandomFromArray(array, count) {
	for (let i = array.length - 1; i > 0; i--) {
		let index = Math.floor(Math.random() * (i + 1));
		[array[i], array[index]] = [array[index], array[i]];
	}

	return array.slice(0, count);
}

// /**
//  * Easy way to interaction reply
//  * @param {interaction} interaction
//  * @param {string} content Strings
//  * @param {Array} embed [Array]
//  * @param {boolean} ephemeral [boolean]
//  * @param {Array} components [Array]
//  * @param {Array} files [Array]
//  * @returns {Promise<interactionReply>}
//  */
// async function interactionReply(interaction, content, embed, hidden, components, files) {
// 		return await interaction.reply({ content: content || null, embeds: embed || [], ephemeral: hidden || false, components: components || [], files: files || [] });
// }

async function buildAndPostListEmbed(movies, title, interaction, settings) {
	settings = settings || {};
	let embeddedMessages = [];
	let number = 1;
	let description = "";
	const emojiMode = settings.emojiMode || false;

	for (let movie of movies) {
		let stringConcat = `**[${emojiMode ? emojis[number++] : number++}: ${movie.name}](https://www.imdb.com/title/${movie.imdbID})** submitted by ${movie.submittedBy} on ${moment(movie.submitted).format("DD MMM YYYY")}\n` +
			`**Release Date:** ${moment(movie.releaseDate).format("DD MMM YYYY")} **Runtime:** ${movie.runtime} Minutes **Rating:** ${movie.rating}\n\n`;
		
		description += stringConcat;
		embeddedMessages.push(stringConcat)
	}

	// Jumlah data per halaman
	const itemsPerPage = 5;
	let paginatedMessages = [];
	for (let i = 0; i < embeddedMessages.length; i += itemsPerPage) {
			let pageItems = embeddedMessages.slice(i, i + itemsPerPage);
			paginatedMessages.push(pageItems.join(""));
	}
	
	let textPages = ["Previous", "Next"];
	let button = [];
	for(let i = 0; i < 2; i++) {
		button.push(createButton(textPages[i]));
	}
	button = [addRow(button)]

	let currentPages = 0;

	startUpButton(button[0], currentPages, paginatedMessages);
	const movieEmbed = new EmbedBuilder()
	.setColor(embedColors(interaction))
	.setTitle(`${title} - Pages ${currentPages + 1}/${paginatedMessages.length}`)
	.setDescription(paginatedMessages[currentPages])
	await interaction.reply({ embeds: [movieEmbed], components: button }).then(msg => {
		if (paginatedMessages.length > 1) {
			let filter = (i) => i.user.id === interaction.user.id && i.customId.startsWith("movieEmbed");
			let collector = msg.createMessageComponentCollector({ filter, time: 60000 });
			
			collector.on("collect", async x => {
				x.deferUpdate();
				let label = x.component.label;
				if (label === "Previous") currentPages--;
				else if (label === "Next") currentPages++;
	
				let description2 = paginatedMessages[currentPages];
				movieEmbed.setDescription(description2);
				movieEmbed.setTitle(`${title} - Pages ${currentPages + 1}/${paginatedMessages.length}`)
	
				setInvisibleButton(x.message, currentPages, paginatedMessages);
				msg.components = x.message.components;
				msg.edit({ embeds: [movieEmbed], components: msg.components })
			}).on("end", async x => {
				await collector.stop();
				msg.components[0].components[0].data.disabled = true;
				msg.components[0].components[1].data.disabled = true;
				msg.edit({ embeds: [movieEmbed], components: msg.components });
			})
		}
		else return [];
	})
}

function createButton(label) {
	return new ButtonBuilder()
	.setLabel(label.toString())
	.setCustomId("movieEmbed" + label)
	.setStyle(label === "X" ? ButtonStyle.Danger : ButtonStyle.Secondary)
}
	
function addRow(row) {
	return new ActionRowBuilder().addComponents(...row);
}
	
function setInvisibleButton(interactions, currentPages, paginatedMessages) {
	for(let inter of interactions.components) {
		for(let i of inter.components) i.data.disabled = false;
	}
	if (!currentPages) interactions.components[0].components[0].data.disabled = true;
	else if (currentPages === (paginatedMessages.length - 1)) interactions.components[0].components[1].data.disabled = true;
	else if (paginatedMessages.length === 1) {
		interactions.components[0].components[0].data.disabled = true;
		interactions.components[0].components[1].data.disabled = true;
	}
}
	
function startUpButton(row, currentPages, embeddedMessages) {
	if (embeddedMessages.length === 1) {
		row.components[0].data.disabled = true;
		row.components[1].data.disabled = true;
	} else if (!currentPages) row.components[0].data.disabled = true;
}

function formatBudget(budget) {
	if (budget >= 1000000000) {
		return '$' + (budget / 1000000000).toFixed(1) + ' Billion';
	} else if (budget >= 1000000) {
		return '$' + (budget / 1000000).toFixed(1) + ' Million';
	} else if (budget >= 1000) {
		return '$' + (budget / 1000).toFixed(1) + ' Thousand';
	} else if (budget >= 100) {
		return '$' + (budget / 100).toFixed(1) + ' Hundred';
	} else {
		return '$' + budget.toLocaleString();
	}
}

function getLanguageEmojiWithName(isoCode) {
	const languageName = languageChanges[isoCode] || isoCode; // Default to isoCode if not found
	return `${languageName}`;
}

function formatProductionCountries(countries) {
	let formattedCountries = [];
	
	countries.forEach(country => {
		const countryName = countryChanges[country.iso_3166_1] || country.name; // Default to isoCode if not found
		let formattedCountry = `:flag_${country.iso_3166_1.toLowerCase()}: ${countryName}`;
		formattedCountries.push(formattedCountry);
	});
	return formattedCountries;
}

module.exports = {
	searchMovieApi,
	movieSearchOptionsForDb,
	buildSingleMovieEmbed,
	buildPosterMovieEmbed,
	buildAndPostListEmbed,
	getRandomFromArray,
	embedColors
};