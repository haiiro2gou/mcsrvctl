import { Client, GatewayIntentBits, Partials } from "discord.js";
import eventHandler from "./handler/event";

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
});

eventHandler(client);

void client.login(process.env.DISCORD_TOKEN);
