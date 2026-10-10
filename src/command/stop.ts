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
        const force = interaction.options.getBoolean("force") ?? false;
        const status = await ping(backend.host(target));
        // a ping failure is "unknown", not "empty"; only a confirmed player count blocks the stop
        if (status.online && status.players > 0 && !force) {
            await interaction.editReply({
                content: `\`${row.alias}\` にはプレイヤーがいます (${status.players} 人)。force を付けると止められます。`,
                allowedMentions: noMentions,
            });
            return;
        }
        await backend.stop(target);

        log(`stop ${target.guildId}/${target.name}${force ? " (force)" : ""}`);
        await interaction.editReply({
            content: `\`${row.alias}\` を停止しました。`,
            allowedMentions: noMentions,
        });
    },
};
