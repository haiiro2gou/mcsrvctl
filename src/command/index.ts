import {
    type AutocompleteInteraction,
    type ChatInputCommandInteraction,
    type Interaction,
    type SlashCommandOptionsOnlyBuilder,
    type SlashCommandSubcommandsOnlyBuilder,
    MessageFlags,
} from "discord.js";

import log from "../util/log.js";
import errorMessage from "../util/error.js";
import { notify } from "./notify.js";
import { server } from "./server.js";
import { start } from "./start.js";
import { stop } from "./stop.js";

export interface Command {
    data: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
    execute: (
        interaction: ChatInputCommandInteraction<"cached">
    ) => Promise<void>;
    autocomplete?: (
        interaction: AutocompleteInteraction<"cached">
    ) => Promise<void>;
}

export const commands = new Map<string, Command>(
    [start, stop, server, notify].map(command => [command.data.name, command])
);

/**
 * Routes one interaction to its command. Only guild slash commands and their autocompletes are handled.
 * A failing command is logged and answered with a fixed text; a failing answer (expired interaction) is ignored.
 * @param interaction any interaction the gateway delivered
 */
export const dispatch = async (interaction: Interaction): Promise<void> => {
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
    } catch (err) {
        log(
            `${interaction.commandName} failed in ${interaction.guildId}: ${errorMessage(err)}`,
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
