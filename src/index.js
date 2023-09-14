require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
eventHandler(client);

client.login(process.env.DISCORD_TOKEN);
