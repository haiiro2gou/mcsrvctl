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
    var result = [true, true, true, true];

    // proxy (ngrok)
    try {
        const proxyResponse = await got({ url: 'http://127.0.0.1:4040/api/tunnels/' });
        const proxyParse = (JSON.parse(proxyResponse.body).tunnels[0].public_url).substring(6).split(':', 2);
        const proxyAddress = proxyParse[0], proxyPort = Number(proxyParse[1]);
        result[0] = getServerStatus(proxyAddress, proxyPort);
    } catch (error) {
        console.log(`Error has occured during getting response from the proxy: ${error}`);
    }

    // hub
    try {
        const hubAddress = '127.0.0.1', hubPort = process.env.SERV_HUB;
        result[1] = getServerStatus(hubAddress, hubPort);
    } catch (error) {
        console.log(`Error has occured during getting response from the hub server: ${error}`);
    }
    // temporary
    try {
        const tempAddress = '192.168.2.121', tempPort = process.env.SERV_TEMP;
        result[2] = getServerStatus(tempAddress, tempPort);
    } catch (error) {
        console.log(`Error has occured during getting response from the temporary server: ${error}`);
    }
    // event
    try {
        const eventAddress = '192.168.2.121', eventPort = process.env.SERV_EVENT;
        result[3] = getServerStatus(eventAddress, eventPort);
    } catch (error) {
        console.log(`Error has occured during getting response from the event server: ${error}`);
    }

    // modify message

});

client.login(process.env.DISCORD_TOKEN);
