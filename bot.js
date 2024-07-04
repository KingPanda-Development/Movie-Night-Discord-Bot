const fs = require("fs");
const path = require("path");
const { ClusterClient } = require('discord-hybrid-sharding');
const keepAlive = require("./server.js");

const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
const mongoose = require("mongoose");
const { token, mongoLogin } = process.env;
const client = new Client({
	partials: [
		Partials.GuildMember,
		Partials.Message,
		Partials.Channel,
		Partials.User,
	],
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildMessageReactions
	],
	allowedMentions: { parse: ["users", "roles"] }, // allowedMentions to prevent unintended role and everyone pings
});

// eslint-disable-next-line no-undef
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));
// eslint-disable-next-line no-undef
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
client.cluster = new ClusterClient(client);

client.commands = new Collection();
mongoose.connect(mongoLogin, { useNewUrlParser: true, useUnifiedTopology: true });

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	client.commands.set(command.data.name, command);
}

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

keepAlive();
client.login(token);