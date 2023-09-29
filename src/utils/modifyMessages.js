import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

export default async(input) => {
    await client.channels.resolve(`${process.env.STATUS_ID}`)?.send('Ping!');
    console.log(`Pinged! ${process.env.STATUS_ID}`);
}
