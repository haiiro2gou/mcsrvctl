import { type AutocompleteInteraction } from "discord.js";

import { listServers } from "../store.js";

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
