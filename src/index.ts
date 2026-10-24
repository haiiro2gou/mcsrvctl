import path from "node:path";
import {
    Client,
    Events,
    GatewayIntentBits,
    MessageFlags,
    type Interaction,
} from "discord.js";
import { backend } from "./backend/index.js";
import { commands } from "./command/index.js";
import { env } from "./env.js";
import { listServers, load } from "./store.js";
import log from "./util/log.js";

const message = (e: unknown): string =>
    e instanceof Error ? e.message : String(e);

const stateFile = path.join(env.stateDir, "state.json");
try {
    load(stateFile);
} catch (e) {
    log(`Failed to load ${stateFile}: ${message(e)}`, "Error");
    throw e;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

/** Routes one interaction to its command; errors are logged and answered with a fixed text. */
const dispatch = async (interaction: Interaction): Promise<void> => {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand() && !interaction.isAutocomplete())
        return;
    const command = commands.get(interaction.commandName);
    if (command === undefined) return;
    try {
        if (interaction.isChatInputCommand()) {
            log(`${interaction.commandName} in ${interaction.guildId}`);
            await command.execute(interaction);
        } else {
            await command.autocomplete?.(interaction);
        }
    } catch (e) {
        log(
            `${interaction.commandName} failed in ${interaction.guildId}: ${message(e)}`,
            "Error"
        );
        if (!interaction.isRepliable()) return;
        // The reply itself may fail (interaction expired); the error is already logged
        if (interaction.deferred) {
            await interaction
                .editReply("処理に失敗しました。")
                .catch(() => undefined);
        } else if (!interaction.replied) {
            await interaction
                .reply({
                    content: "処理に失敗しました。",
                    flags: MessageFlags.Ephemeral,
                })
                .catch(() => undefined);
        }
    }
};

/** Stops every server of a guild that removed the bot; the settings stay for a re-invite. */
const stopAll = async (guildId: string): Promise<void> => {
    const servers = listServers(guildId);
    log(`Guild ${guildId} has left; stopping ${servers.length} servers`);
    for (const { name } of servers) {
        await backend.stop({ guildId, name }).catch((e: unknown) => {
            log(
                `Stop ${guildId}/${name} after guild delete failed: ${message(e)}`,
                "Warn"
            );
        });
    }
};

client.once(Events.ClientReady, readyClient => {
    void readyClient.application.commands.set(
        [...commands.values()].map(c => c.data)
    );
    log(
        `Ready as ${readyClient.user.tag} in ${readyClient.guilds.cache.size} guilds`
    );
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
