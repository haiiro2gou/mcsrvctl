import {
    type AutocompleteInteraction,
    type ChatInputCommandInteraction,
    type SlashCommandOptionsOnlyBuilder,
    type SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
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

// adding a command = one file plus one entry here; nothing is loaded from the file system
export const commands = new Map<string, Command>(
    [start, stop, server, notify].map(c => [c.data.name, c])
);
