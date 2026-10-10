import { eq } from "drizzle-orm";
import {
    ChannelType,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type Client,
} from "discord.js";
import { db } from "../db/instance.js";
import { notifyChannel } from "../db/schema.js";
import { renderStatus } from "../status.js";
import { listBuilds, noMentions } from "./build.js";
import { type Command } from "./index.js";
import log from "../util/log.js";

// Best-effort removal of a status message
const deleteMessage = async (
    client: Client,
    channelId: string,
    messageId: string
): Promise<void> => {
    try {
        const channel = await client.channels.fetch(channelId);
        if (channel?.isTextBased() === true)
            await channel.messages.delete(messageId);
    } catch {
        // nothing to do: the message or channel is already gone
    }
};

export const notify: Command = {
    data: new SlashCommandBuilder()
        .setName("notify")
        .setDescription("状態表を出すチャンネルを管理する")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s =>
            s
                .setName("set")
                .setDescription("状態表を出すチャンネルを決める")
                .addChannelOption(o =>
                    o
                        .setName("channel")
                        .setDescription("テキストチャンネル")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(s =>
            s.setName("remove").setDescription("状態表を止める")
        ),
    execute: async interaction => {
        const current = db
            .select()
            .from(notifyChannel)
            .where(eq(notifyChannel.guildId, interaction.guildId))
            .get();
        if (interaction.options.getSubcommand() === "remove") {
            if (current === undefined) {
                await interaction.reply({
                    content: "通知先は設定されていません。",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
            db.delete(notifyChannel)
                .where(eq(notifyChannel.guildId, interaction.guildId))
                .run();
            log(`notify remove ${interaction.guildId}`);
            await deleteMessage(
                interaction.client,
                current.channelId,
                current.messageId
            );
            await interaction.reply("通知を止めました。");
            return;
        }
        const channel = interaction.options.getChannel("channel", true, [
            ChannelType.GuildText,
        ]);
        if (channel.guildId !== interaction.guildId) {
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
        const rows = listBuilds(interaction.guildId).map(b => ({
            alias: b.alias,
            status: undefined,
        }));
        const message = await channel.send({
            content: renderStatus(rows),
            allowedMentions: noMentions,
        });
        db.insert(notifyChannel)
            .values({
                guildId: interaction.guildId,
                channelId: channel.id,
                messageId: message.id,
            })
            .onConflictDoUpdate({
                target: notifyChannel.guildId,
                set: { channelId: channel.id, messageId: message.id },
            })
            .run();
        log(`notify set ${interaction.guildId} -> ${channel.id}`);
        if (current !== undefined) {
            await deleteMessage(
                interaction.client,
                current.channelId,
                current.messageId
            );
        }
        await interaction.editReply(
            `通知先を ${channel.toString()} にしました。`
        );
    },
};
