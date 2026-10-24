import {
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";

import log from "../util/log.js";
import { backend } from "../backend/index.js";
import { ping } from "../status.js";
import { findServer } from "../store.js";
import { type Command } from "./index.js";
import { autocompleteServer, noMentions } from "./common.js";
import { accept } from "./cooldown.js";

export const stop: Command = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("サーバーを停止する")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(o =>
            o
                .setName("server")
                .setDescription("停止するサーバー")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addBooleanOption(o =>
            o.setName("force").setDescription("プレイヤーがいても止める")
        ),
    autocomplete: autocompleteServer,
    execute: async interaction => {
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
        if (!accept(guildId, server.name)) {
            await interaction.reply({
                content: "しばらく待ってからもう一度お願いします。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
        await interaction.deferReply();
        const target = { guildId, name: server.name };
        const force = interaction.options.getBoolean("force") ?? false;
        const status = await ping(backend.host(target));
        if (status.online && status.players > 0 && !force) {
            await interaction.editReply({
                content: `\`${server.alias}\` には参加しているプレイヤーがいます (${status.players} 人)。\n強制的に停止する場合は force フラグを付けてください。`,
                allowedMentions: noMentions,
            });
            return;
        }
        await backend.stop(target);
        log(`stop ${guildId}/${server.name}${force ? " (force)" : ""}`);
        await interaction.editReply({
            content: `\`${server.alias}\` を停止しました。`,
            allowedMentions: noMentions,
        });
    },
};
