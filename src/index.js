import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits } from 'discord.js';
import eventHandler from './handlers/eventHandler.cjs';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
eventHandler(client);

import cron from 'node-cron';
import got from 'got';
import getServerStatus from './utils/getServerStatus.js';

cron.schedule('*/15 * * * * *', async () => {
    console.log('Started pinging to the server!');

    // proxy
    try {
        const response = await got('http://127.0.0.1:4040/api/tunnels/');
        const proxyAddress = (JSON.parse(response.body).tunnels[0].public_url).substring(6);
        getServerStatus(proxyAddress);
    } catch (error) {
        console.log(`Error has occured during getting response from the proxy: ${error}`);
    }

    // hub
    

    // temporary

    // event
});

client.login(process.env.DISCORD_TOKEN);
