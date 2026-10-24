import { type AutocompleteInteraction } from "discord.js";

import { listServers } from "../store.js";

export const autocompleteServer = async (
    interaction: AutocompleteInteraction<"cached">
): Promise<void> => {
    const typed = interaction.options.getFocused().toLowerCase();
    const choices = listServers(interaction.guildId)
        .filter(b => b.alias.toLowerCase().startsWith(typed))
        .slice(0, 25)
        .map(b => ({ name: `${b.alias} (${b.name})`, value: b.name }));
    await interaction.respond(choices);
};

export const noMentions = { parse: [] } as const;
