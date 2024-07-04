const emojis = require("../../config & JSON/emojis.json");
const { Movie } = require("../../Models/schema");
const c = require("ansi-colors");

async function removeList(interaction, viewedMovies) {
	if (!interaction.member.permissions.has("Administrator")) return interaction.reply({ content: "Sorry, only Administrators can delete all movies.", ephemeral: true });

	return interaction.reply({ content: "Are you sure you want to remove all unviewed movies?" }).then(async (msgs) => {
		const botMessage = await interaction.fetchReply();
		const filter = (reaction, user) => [emojis.yes, emojis.no].includes(reaction.emoji.name) && user.id == interaction.member.id;

		try {
			await botMessage.react(emojis.yes);
			await botMessage.react(emojis.no);
		} catch (e) {
			console.log(c.grey("〔 RemoveList.js 〕➜ Message deleted"));
		}

		//Wait for user to confirm if movie presented to them is what they wish to be added to the list or not.
		return botMessage
			.awaitReactions({ filter: filter, max: 1, time: 30000, errors: ["time"] })
			.then(async (collected) => {
				const reaction = collected.first();

				if (reaction.emoji.name == emojis.yes) {
					await Movie.deleteMany({ guildID: interaction.guild.id, viewed: viewedMovies });
					msgs.delete().catch((error) => {
						console.log(c.grey("〔 RemoveList.js 〕➜ Message deleted"));
					})
					
					return interaction.followUp({ content: "All movies have been deleted.", ephemeral: true });
				} else {
					msgs.delete().catch((error) => {
						console.log(c.grey("〔 RemoveList.js 〕➜ Message deleted"));
					})
					return interaction.followUp({ content: "No movies have been deleted.", ephemeral: true });
				}
			})
			.catch(async () => {
				msgs.delete().catch((error) => {
					console.log(c.grey("〔 RemoveList.js 〕➜ Message deleted"));
				})
				return interaction.followUp({ content: "Couldn't get your response.", ephemeral: true });
			});
	});
}

module.exports = removeList;