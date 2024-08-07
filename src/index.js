import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import cron from 'node-cron';
import log from './utils/logOutput.cjs';
import { GatewayIntentBits, Client, Partials } from 'discord.js';

import eventHandler from './handlers/eventHandler.js';
import { queueProcess, filterServerCache, updateServerStatus } from './handlers/timeHandler.js';

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

if (!fs.existsSync(path.join(__dirname, '..', 'config.json'))) {
    log('Config file cannot be found.', 'Warn');
    fs.writeFileSync(path.join(__dirname, '..', 'config.json'), '{"guilds":[]}');
    log('Config file has been generated.', 'Warn');
}
if (!fs.existsSync(path.join(__dirname, '..', 'cache.json'))) {
    log('Cache file cannot be found.', 'Warn');
    fs.writeFileSync(path.join(__dirname, '..', 'cache.json'), '{"cursor":"","guilds":[],"queue":[],"notification":[]}');
    log('Cache file has been generated.', 'Warn');
}

eventHandler(client);
cron.schedule('*/10 * * * * *', async () => {
    queueProcess();
});
cron.schedule('0 * * * * *', async () => {
    updateServerStatus(client);
});
cron.schedule('0 0 5 * * *', async () => {
    filterServerCache();
});

client.login(process.env.DISCORD_TOKEN);
