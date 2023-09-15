import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits } from 'discord.js';
import eventHandler from './handlers/eventHandler.cjs';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
eventHandler(client);

client.login(process.env.DISCORD_TOKEN);
