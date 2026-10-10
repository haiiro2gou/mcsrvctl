import { eq } from "drizzle-orm";
import {
    Client,
    Events,
    GatewayIntentBits,
    type Interaction,
} from "discord.js";
import { backend } from "./backend/index.js";
import { commands } from "./command/index.js";
import { backup } from "./db/index.js";
import { db } from "./db/instance.js";
import { build } from "./db/schema.js";
import { env } from "./env.js";
import log from "./util/log.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const message = (e: unknown): string =>
    e instanceof Error ? e.message : String(e);

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
        // the reply itself may fail (interaction expired); the error above is already logged
        if (interaction.deferred) {
            await interaction
                .editReply("処理に失敗しました。")
                .catch(() => undefined);
        } else if (!interaction.replied) {
            await interaction
                .reply({ content: "処理に失敗しました。", ephemeral: true })
                .catch(() => undefined);
        }
    }
};

// Stop every server of a guild that removed the bot
// Re-invite restores the setup
const stopAll = async (guildId: string): Promise<void> => {
    const rows = db
        .select()
        .from(build)
        .where(eq(build.guildId, guildId))
        .all();
    log(`left guild ${guildId}; stopping ${rows.length} servers`);
    for (const row of rows) {
        await backend.stop({ guildId, name: row.name }).catch((e: unknown) => {
            log(
                `stop ${guildId}/${row.name} after guild delete failed: ${message(e)}`,
                "Warn"
            );
        });
    }
};

const runBackup = (): void => {
    void backup(db, env.stateDir, env.backupUrl);
};

client.once(Events.ClientReady, readyClient => {
    void readyClient.application.commands.set(
        [...commands.values()].map(c => c.data)
    );
    runBackup();
    // unref: timers must not keep the process alive after the client is destroyed
    setInterval(runBackup, 24 * 60 * 60 * 1000).unref();
    log(
        `ready as ${readyClient.user.tag} in ${readyClient.guilds.cache.size} guilds`
    );
});
client.on(Events.InteractionCreate, interaction => {
    void dispatch(interaction);
});
client.on(Events.GuildDelete, guild => {
    void stopAll(guild.id);
});

const shutdown = (): void => {
    void client.destroy().finally(() => {
        db.$client.close();
    });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

void client.login(env.discordToken);
