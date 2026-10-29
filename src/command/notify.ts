import {
    ChannelType,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type Client,
} from "discord.js";

import log from "../util/log.js";
import { renderStatus } from "../status.js";
import {
    clearNotify,
    getNotify,
    listServers,
    setNotify,
    type Notify,
} from "../store.js";
import { type Command } from "./index.js";
import { noMentions } from "./common.js";

const deleteBoard = async (client: Client, board: Notify): Promise<void> => {
    try {
        const channel = await client.channels.fetch(board.channelId);
        if (channel?.isTextBased() === true)
            await channel.messages.delete(board.messageId);
    } catch (err) {
        log(
            `Old board ${board.channelId}/${board.messageId} not deleted: ${err instanceof Error ? err.message : String(err)}`,
            "Warn"
        );
    }
};

type Interaction = Parameters<Command["execute"]>[0];

const set = async (interaction: Interaction): Promise<void> => {
    const { guildId } = interaction;
    const channel = interaction.options.getChannel("channel", true, [
        ChannelType.GuildText,
    ]);
    if (channel.guildId !== guildId) {
        await interaction.reply({
            content: "このサーバーのチャンネルを選んでください。",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
    const me = interaction.guild.members.me;
    const allowed =
        me !== null &&
        channel
            .permissionsFor(me)
            .has([
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
            ]);
    if (!allowed) {
        await interaction.reply({
            content: "指定のチャンネルに投稿できません。",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
    await interaction.deferReply();
    const previous = getNotify(guildId);
    const rows = listServers(guildId).map(server => ({
        alias: server.alias,
        status: undefined,
    }));
    const message = await channel.send({
        content: renderStatus(rows),
        allowedMentions: noMentions,
    });
    setNotify(guildId, { channelId: channel.id, messageId: message.id });
    log(`Notify set ${guildId} -> ${channel.id}`);
    if (previous !== undefined) await deleteBoard(interaction.client, previous);
    await interaction.editReply(
        `通知先を ${channel.toString()} に設定しました。`
    );
};

const remove = async (interaction: Interaction): Promise<void> => {
    const { guildId } = interaction;
    const previous = getNotify(guildId);
    if (previous === undefined) {
        await interaction.reply({
            content: "通知先は設定されていません。",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
    clearNotify(guildId);
    log(`Notify remove ${guildId}`);
    await deleteBoard(interaction.client, previous);
    await interaction.reply("通知を停止しました。");
};

export const notify: Command = {
    data: new SlashCommandBuilder()
        .setName("notify")
        .setDescription("サーバー状況を表示するチャンネルを管理する")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("サーバー状況を表示するチャンネルを設定する")
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("テキストチャンネル")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("サーバー状況の表示を止める")
        ),
    execute: interaction =>
        interaction.options.getSubcommand() === "set"
            ? set(interaction)
            : remove(interaction),
};
