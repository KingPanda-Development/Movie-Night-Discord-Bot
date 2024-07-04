const { Events } = require("discord.js");
const { Setting } = require("../Models/schema");
const c = require("ansi-colors");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isCommand() && !interaction.isAutocomplete()) return;

		const client = interaction.client;
		let fetchedSettings;

		fetchedSettings = await Setting.findOne({ guildID: interaction.guildId });

		if (!fetchedSettings) {
			fetchedSettings = await new Setting({ guildID: interaction.guildId }).save();
		}
		if (!fetchedSettings)
			return await interaction.reply({ content: "Couldn't fetch my settings. Try reinviting me.", ephemeral: true });

		// If no permissions
		if (interaction.guild && !interaction.channel.permissionsFor(client.application.id).has(["AddReactions", "ManageMessages", "EmbedLinks", "ReadMessageHistory", "ViewChannel", "SendMessages"])) {
			return await interaction.reply({ content:
						"Bot cannot correctly run commands in this channel. \nPlease update bots permissions for this channel to include:\n" +
							"SEND MESSAGES, ADD REACTION, MANAGE MESSAGES, EMBED LINKS, READ MESSAGE HISTORY, VIEW CHANNEL\nAdmins may need to adjust the hierarchy of permissions.", ephemeral: true })
		}

		// Handling autocomplete
		if (interaction.isAutocomplete()) {
			const command = client.commands.get(interaction.commandName);
			if (command && command.autoComplete) {
				await command.autoComplete(interaction);
			}
			return;
		}

		// Handling regular commands
		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		//console.log(command.data.name + " " + new Date());
		//await interaction.deferReply(); // Responsibility of command.
		await command.execute(interaction, fetchedSettings);
	},
};