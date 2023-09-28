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

    // proxy (ngrok)
    try {
        const proxyResponse = await got({ url: `http://${process.env.SELF_IP}:4040/api/tunnels/` });
        const proxyParse = (JSON.parse(proxyResponse.body).tunnels[0].public_url).substring(6).split(':', 2);
        const proxyAddress = proxyParse[0], proxyPort = Number(proxyParse[1]);
        const proxyResult = await getServerStatus(proxyAddress, proxyPort);

        if (proxyResult.check) {
            console.log(`The proxy server is online!`);
        } else {
            console.log(`The proxy server is offline...`);
        }
    } catch (error) {
        console.log(`Error has occured during getting response from the proxy: ${error}`);
    }

    // hub
    try {
        const hubAddress = process.env.SELF_IP, hubPort = Number(process.env.SERV_HUB);
        const hubResult = await getServerStatus(hubAddress, hubPort);

        if (hubResult.check) {
            console.log(`The hub server is online!`);
        } else {
            console.log(`The hub server is offline...`);
        }
    } catch (error) {
        console.log(`Error has occured during getting response from the hub server: ${error}`);
    }
    // temporary
    try {
        const tempAddress = process.env.HUB_IP, tempPort = Number(process.env.SERV_TEMP);
        const tempResult = await getServerStatus(tempAddress, tempPort);
        
        if (tempResult.check) {
            console.log(`The temporary server is online!`);
        } else {
            console.log(`The temporary server is offline...`);
        }
    } catch (error) {
        console.log(`Error has occured during getting response from the temporary server: ${error}`);
    }
    // event
    try {
        const eventAddress = process.env.HUB_IP, eventPort = Number(process.env.SERV_EVENT);
        const eventResult = await getServerStatus(eventAddress, eventPort);
        
        if (eventResult.check) {
            console.log(`The event server is online!`);
        } else {
            console.log(`The event server is offline...`);
        }
    } catch (error) {
        console.log(`Error has occured during getting response from the event server: ${error}`);
    }

    // modify message

});

client.login(process.env.DISCORD_TOKEN);
