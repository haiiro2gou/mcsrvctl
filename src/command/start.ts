import {
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";

import log from "../util/log.js";
import { backend } from "../backend/index.js";
import { resetIdle } from "../monitor.js";
import { ping } from "../status.js";
import { findServer } from "../store.js";
import { type Command } from "./index.js";
import { autocompleteServer, noMentions } from "./common.js";
import { accept } from "./cooldown.js";

export const start: Command = {
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("サーバーを起動する")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option
                .setName("server")
                .setDescription("起動するサーバー")
                .setRequired(true)
                .setAutocomplete(true)
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
                content: "しばらく待ってからもう一度お試しください。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
        await interaction.deferReply();
        const target = { guildId, name: server.name };
        const status = await ping(backend.host(target));
        if (status.online) {
            await interaction.editReply({
                content: `\`${server.alias}\` は既に起動しています。`,
                allowedMentions: noMentions,
            });
            return;
        }
        await backend.start(target);
        resetIdle(guildId, server.name);
        log(`Start ${guildId}/${server.name}`);
        await interaction.editReply({
            content: `\`${server.alias}\` を起動しました。`,
            allowedMentions: noMentions,
        });
    },
};
