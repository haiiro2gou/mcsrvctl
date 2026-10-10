import { and, eq } from "drizzle-orm";
import {
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { backend, NotFoundError } from "../backend/index.js";
import { db } from "../db/instance.js";
import { build } from "../db/schema.js";
import {
    autocompleteBuild,
    findBuild,
    listBuilds,
    noMentions,
} from "./build.js";
import { type Command } from "./index.js";
import log from "../util/log.js";
import { isAlias, isName } from "./validate.js";

const maxBuilds = 10; // per guild

export const server: Command = {
    data: new SlashCommandBuilder()
        .setName("server")
        .setDescription("サーバーの登録を管理する")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s =>
            s
                .setName("add")
                .setDescription("サーバーを登録する")
                .addStringOption(o =>
                    o
                        .setName("name")
                        .setDescription("Deployment / container の名前")
                        .setRequired(true)
                )
                .addStringOption(o =>
                    o
                        .setName("alias")
                        .setDescription("表示名 (32 文字まで)")
                        .setRequired(true)
                )
        )
        .addSubcommand(s =>
            s
                .setName("remove")
                .setDescription("サーバーの登録を外す")
                .addStringOption(o =>
                    o
                        .setName("server")
                        .setDescription("外すサーバー")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),
    autocomplete: autocompleteBuild,
    execute: async interaction => {
        if (interaction.options.getSubcommand() === "add") {
            await add(interaction);
            return;
        }
        await remove(interaction);
    },
};

type Interaction = Parameters<Command["execute"]>[0];

const add = async (interaction: Interaction): Promise<void> => {
    const name = interaction.options.getString("name", true);
    const alias = interaction.options.getString("alias", true);
    const reject = async (content: string): Promise<void> => {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    };
    if (!isName(name)) {
        return reject(
            "name は小文字英数字と - だけ (先頭と末尾は英数字、63 文字まで) です。"
        );
    }
    if (!isAlias(alias)) {
        return reject(
            "alias は 1〜32 文字で、@ # < > と改行を含められません。"
        );
    }
    if (listBuilds(interaction.guildId).length >= maxBuilds)
        return reject(`登録できるサーバーは ${maxBuilds} 件までです。`);

    await interaction.deferReply();
    const target = { guildId: interaction.guildId, name };
    if (!(await backend.exists(target))) {
        await interaction.editReply(
            "そのサーバーは見つかりません。先に運用者が作る必要があります。"
        );
        return;
    }
    const inserted = db
        .insert(build)
        .values({ guildId: interaction.guildId, name, alias })
        .onConflictDoNothing()
        .run();
    if (inserted.changes === 0) {
        await interaction.editReply({
            content: "同じ name が既に登録されています。",
            allowedMentions: noMentions,
        });
        return;
    }
    log(`add build ${interaction.guildId}/${name}`);
    await interaction.editReply({
        content: `\`${alias}\` (\`${name}\`) を登録しました。`,
        allowedMentions: noMentions,
    });
};

const remove = async (interaction: Interaction): Promise<void> => {
    const row = findBuild(
        interaction.guildId,
        interaction.options.getString("server", true)
    );
    if (row === undefined) {
        await interaction.reply({
            content: "そのサーバーは見つかりません。",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
    await interaction.deferReply();
    try {
        await backend.stop({ guildId: row.guildId, name: row.name });
    } catch (e) {
        if (!(e instanceof NotFoundError)) throw e;
    }
    db.delete(build)
        .where(and(eq(build.guildId, row.guildId), eq(build.name, row.name)))
        .run();
    log(`remove build ${row.guildId}/${row.name}`);
    await interaction.editReply({
        content: `\`${row.alias}\` を削除しました。`,
        allowedMentions: noMentions,
    });
};
