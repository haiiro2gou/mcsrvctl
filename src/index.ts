import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// eventHandler(client);

void client.login(process.env.DISCORD_TOKEN);
