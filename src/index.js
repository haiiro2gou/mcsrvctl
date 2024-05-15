import dotenv from 'dotenv';
dotenv.config();
import { GatewayIntentBits, Client, Partials } from 'discord.js';
import eventHandler from './handlers/eventHandler.js';

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
    ],
});

eventHandler(client);

client.login(process.env.DISCORD_TOKEN);
