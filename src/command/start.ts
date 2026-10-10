import {
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { backend } from "../backend/index.js";
import { ping } from "../status.js";
import { autocompleteBuild, findBuild, noMentions } from "./build.js";
import { accept } from "./cooldown.js";
import { type Command } from "./index.js";
import log from "../util/log.js";

export const start: Command = {
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("サーバーを起動する")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(o =>
            o
                .setName("server")
                .setDescription("起動するサーバー")
                .setRequired(true)
                .setAutocomplete(true)
        ),
    autocomplete: autocompleteBuild,
    execute: async interaction => {
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
        if (!accept(row.guildId, row.name)) {
            await interaction.reply({
                content: "しばらく待ってからもう一度お願いします。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
        await interaction.deferReply();
        const target = { guildId: row.guildId, name: row.name };
        const status = await ping(backend.host(target));
        if (status.online) {
            await interaction.editReply({
                content: `\`${row.alias}\` は既に動いています。`,
                allowedMentions: noMentions,
            });
            return;
        }
        await backend.start(target);

        log(`start ${target.guildId}/${target.name}`);
        await interaction.editReply({
            content: `\`${row.alias}\` を起動しました。`,
            allowedMentions: noMentions,
        });
    },
};
