const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const c = require("ansi-colors");
const movieList = require("../config & JSON/movieNameList.json");
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("info")
		.setDescription("Gets number of guilds and members the bot is in"),
	async execute(interaction) {
		const promises = [
			interaction.client.cluster.fetchClientValues('guilds.cache.size'),
			interaction.client.cluster.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
		];
		
		return Promise.all(promises)
			.then(async results => {
				const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
				const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);
				const imageBuffer = fs.readFileSync("./image/MovieBotOfficial.gif");
				const attachment = new AttachmentBuilder(imageBuffer, { name: "MovieBotOfficial.gif" });
				
				const embed = new EmbedBuilder()
				.setColor(0x03a9f4)
				.setThumbnail(interaction.client.cluster.client.user.displayAvatarURL({ extension: "gif" }))
				.setDescription(`**${interaction.client.cluster.client.user.username}** is a specially designed digital assistant to help you create and manage movie playlists effortlessly. Add, sort, or remove films from your playlist, and get comprehensive information about each movie. With intuitive features, personalized recommendations, and the ability to facilitate users in finding films, **${interaction.client.cluster.client.user.username}** ensures that your experience in compiling movie playlists is efficient and engaging.\n\n**Developer:** \`KingPanda#6669\``)
				.setImage("attachment://MovieBotOfficial.gif")
				.addFields([
					{
						name: "➭ Server Count",
						value: totalGuilds + "",
						inline: true
					},
					{
						name: "➭ Member Count",
						value: totalMembers + "",
						inline: true
					},
					{
						name: "➭ Total Movie",
						value: (movieList.name.length || "`UNKNOWN`") + "",
						inline: false
					},
				])
				
				return await interaction.reply({ embeds: [embed], files: [attachment] });
			})
	}
};