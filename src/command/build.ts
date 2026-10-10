import { and, eq } from "drizzle-orm";
import { type AutocompleteInteraction } from "discord.js";
import { db } from "../db/instance.js";
import { build, type Build } from "../db/schema.js";

// The build row for this guild and name, or undefined
export const findBuild = (guildId: string, name: string): Build | undefined =>
    db
        .select()
        .from(build)
        .where(and(eq(build.guildId, guildId), eq(build.name, name)))
        .get();

export const listBuilds = (guildId: string): Build[] =>
    db.select().from(build).where(eq(build.guildId, guildId)).all();

// Autocomplete for a server option
export const autocompleteBuild = async (
    interaction: AutocompleteInteraction<"cached">
): Promise<void> => {
    const typed = interaction.options.getFocused().toLowerCase();
    const choices = listBuilds(interaction.guildId)
        .filter(b => b.alias.toLowerCase().startsWith(typed))
        .slice(0, 25)
        .map(b => ({ name: `${b.alias} (${b.name})`, value: b.name }));
    await interaction.respond(choices);
};

export const noMentions = { parse: [] } as const;
