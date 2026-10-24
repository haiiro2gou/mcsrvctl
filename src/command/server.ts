import {
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";

import log from "../util/log.js";
import { backend, NotFoundError } from "../backend/index.js";
import {
    addServer,
    findServer,
    listServers,
    maxServers,
    removeServer,
} from "../store.js";
import { type Command } from "./index.js";
import { autocompleteServer, noMentions } from "./common.js";
import { isAlias, isName } from "./validate.js";

type Interaction = Parameters<Command["execute"]>[0];

const add = async (interaction: Interaction): Promise<void> => {
    const { guildId } = interaction;
    const name = interaction.options.getString("name", true);
    const alias = interaction.options.getString("alias", true);
    const reject = async (content: string): Promise<void> => {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    };
    if (!isName(name)) {
        return reject(
            "name には小文字英数字と - が使用できます (先頭と末尾は英数字、63 文字まで) 。"
        );
    }
    if (!isAlias(alias)) {
        return reject(
            "alias は 1〜32 文字で、@ # < > と改行を含められません。"
        );
    }
    if (findServer(guildId, name) !== undefined)
        return reject("同じ name が既に登録されています。");
    if (listServers(guildId).length >= maxServers)
        return reject(`登録できるサーバーは ${maxServers} 件までです。`);

    await interaction.deferReply();
    if (!(await backend.exists({ guildId, name }))) {
        await interaction.editReply(
            "そのサーバーは見つかりません。先に管理者が作る必要があります。"
        );
        return;
    }
    if (!addServer(guildId, { name, alias })) {
        await interaction.editReply(
            "同時に別の登録があったため、登録できませんでした。"
        );
        return;
    }
    log(`Add server ${guildId}/${name}`);
    await interaction.editReply({
        content: `\`${alias}\` (\`${name}\`) を登録しました。`,
        allowedMentions: noMentions,
    });
};

const remove = async (interaction: Interaction): Promise<void> => {
    const { guildId } = interaction;
    const server = findServer(
        guildId,
        interaction.options.getString("server", true)
    );
    if (server === undefined) {
        await interaction.reply({
            content: "そのサーバーは見つかりません。",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
    await interaction.deferReply();
    try {
        await backend.stop({ guildId, name: server.name });
    } catch (err) {
        if (!(err instanceof NotFoundError)) throw err;
    }
    removeServer(guildId, server.name);
    log(`Remove server ${guildId}/${server.name}`);
    await interaction.editReply({
        content: `\`${server.alias}\` を削除しました。`,
        allowedMentions: noMentions,
    });
};

export const server: Command = {
    data: new SlashCommandBuilder()
        .setName("server")
        .setDescription("サーバーの登録を管理する")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("サーバーを登録する")
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription(
                            "サーバー名 (小文字英数字と -、63 文字まで)"
                        )
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("alias")
                        .setDescription("表示名 (32 文字まで)")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("サーバーを削除する")
                .addStringOption(option =>
                    option
                        .setName("server")
                        .setDescription("削除するサーバー")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),
    autocomplete: autocompleteServer,
    execute: interaction =>
        interaction.options.getSubcommand() === "add"
            ? add(interaction)
            : remove(interaction),
};
