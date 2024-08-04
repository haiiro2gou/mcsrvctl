import dotenv from 'dotenv';
dotenv.config();
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import config from '../config.json' assert { type: "json" };

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

client.once("ready", async (client) => {
    for (const element of config.guilds) {
        const guild = await client.guilds.fetch(element.id);
        const commands = await guild.commands.fetch();
        console.log(JSON.stringify(commands, null, 4));
    }
    process.exit(0);
})

client.login(process.env.DISCORD_TOKEN);
