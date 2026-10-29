import { type AutocompleteInteraction } from "discord.js";

import { listServers } from "../store.js";

/**
 * Answers a server autocomplete with the guild's servers whose alias starts with the typed text.
 * Shows "alias (name)" and returns the name, at most 25 choices as Discord allows.
 * @param interaction autocomplete interaction from a guild
 */
export const autocompleteServer = async (
    interaction: AutocompleteInteraction<"cached">
): Promise<void> => {
    const typed = interaction.options.getFocused().toLowerCase();
    const choices = listServers(interaction.guildId)
        .filter(server => server.alias.toLowerCase().startsWith(typed))
        .slice(0, 25)
        .map(server => ({
            name: `${server.alias} (${server.name})`,
            value: server.name,
        }));
    await interaction.respond(choices);
};

export const noMentions = { parse: [] } as const;
