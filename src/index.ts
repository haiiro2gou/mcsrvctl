import path from "node:path";
import { Client, Events, GatewayIntentBits } from "discord.js";

import log from "./util/log.js";
import errorMessage from "./util/error.js";
import { env } from "./env.js";
import { startMonitor } from "./monitor.js";
import { backup, load } from "./store.js";
import { stopAll } from "./backend/index.js";
import { commands, dispatch } from "./command/index.js";

const stateFile = path.join(env.stateDir, "state.json");
try {
    load(stateFile);
} catch (err) {
    log(`Failed to load ${stateFile}: ${errorMessage(err)}`, "Error");
    throw err;
}

const dayMs = 24 * 60 * 60 * 1000;
void backup(env.backupUrl);
setInterval(() => {
    void backup(env.backupUrl);
}, dayMs).unref();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
    void readyClient.application.commands.set(
        [...commands.values()].map(command => command.data)
    );
    log(
        `Ready as ${readyClient.user.tag} in ${readyClient.guilds.cache.size} guilds`
    );
    startMonitor(readyClient);
});
client.on(Events.InteractionCreate, interaction => {
    void dispatch(interaction);
});
client.on(Events.GuildDelete, guild => {
    void stopAll(guild.id);
});

const shutdown = (): void => {
    void client.destroy();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

void client.login(env.discordToken);
