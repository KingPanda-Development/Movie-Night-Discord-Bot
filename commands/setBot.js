const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setbot")
    .setDescription("Set the bot image profile!")
    .addAttachmentOption(
      option =>
        option
          .setName("avatar")
          .setDescription("The avatar to animate")
          .setRequired(false),
    )
    .addAttachmentOption(
      option =>
        option
          .setName("banner")
          .setDescription("The banner to animate")
          .setRequired(false),
    ),
  async execute(interaction, settings) {
    const { options } = interaction;
    const avatar = options.getAttachment("avatar");
    const banner = options.getAttachment("banner");

    async function sendMessage(message) {
      const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setDescription(message);

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    if (avatar !== null && avatar.contentType !== "image/gif")
      return await sendMessage("⚠ Please use a gif format for animated image");
    if (banner !== null && banner.contentType !== "image/gif")
      return await sendMessage("⚠ Please use a gif format for animated image");

    var error;
    if (avatar !== null) {
      await interaction.client.cluster.client.user.setAvatar(avatar.url).catch(async (err) => {
        error = true;
        return await sendMessage(`⚠ Error: \`${err.toString()}\``);
      });
      
      if (error) return;

      await sendMessage(`I have uploaded your avatar`);
    }
    
    if (banner !== null) {
      await interaction.client.cluster.client.user.setBanner(banner.url).catch(async (err) => {
        error = true;
        return await sendMessage(`⚠ Error: \`${err.toString()}\``);
      });
      
      if (error) return;

      await sendMessage(`I have uploaded your banner`);
    }

  },
};
