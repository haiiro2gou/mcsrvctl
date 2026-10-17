import { readJson, writeJson } from "./util/io.js";
import log from "./util/log.js";

export interface Build {
    name: string;
    alias: string;
}
export interface Notify {
    channelId: string;
    messageId: string;
}
export interface GuildState {
    builds: Build[];
    notify?: Notify;
}
export type State = Record<string, GuildState>;

export const maxBuilds = 10;
const state: { current: { file: string; data: State } } = {
    current: { file: "", data: {} },
};
/** Narrows a parsed JSON value to State: a non-null, non-array object. */
const isState = (v: unknown): v is State =>
    typeof v === "object" && v !== null && !Array.isArray(v);
/** Writes the next state to the file, then makes it current, so a failed write leaves memory unchanged. */
const save = (data: State): void => {
    writeJson(state.current.file, data);
    state.current = { ...state.current, data };
};
/** Looks up a guild's state; undefined when nothing has been registered for it yet. */
const guildOf = (guildId: string): GuildState | undefined =>
    Object.hasOwn(state.current.data, guildId)
        ? state.current.data[guildId]
        : undefined;

/**
 * Loads the state file into memory. Call once at startup before any other store function.
 * @param file path of state.json; a missing file starts an empty state
 * @throws when the file is not valid JSON or its top level is not an object
 */
export const load = (file: string): void => {
    const data = readJson(file) ?? {};
    if (!isState(data)) throw new Error(`${file} is not an object`);
    state.current = { file, data };
};

/**
 * Lists the builds registered in a guild.
 * @param guildId Discord guild ID
 * @returns the builds in registration order, empty when the guild has none
 */
export const listBuilds = (guildId: string): readonly Build[] =>
    guildOf(guildId)?.builds ?? [];

/**
 * Finds a build of a guild by its name.
 * @param guildId Discord guild ID
 * @param buildName build name (DNS label)
 * @returns the build, or undefined when the guild has no build with that name
 */
export const findBuild = (
    guildId: string,
    buildName: string
): Build | undefined => listBuilds(guildId).find(b => b.name === buildName);

/**
 * Returns the status board channel of a guild.
 * @param guildId Discord guild ID
 * @returns the channel and message IDs, or undefined when none is set
 */
export const getNotify = (guildId: string): Notify | undefined =>
    guildOf(guildId)?.notify;

/**
 * Registers a build and writes the state file.
 * The name check and the cap are applied here, synchronously, so concurrent commands cannot bypass them.
 * @param guildId Discord guild ID
 * @param build validated name and alias
 * @returns false when the name is already taken or the guild has maxBuilds builds; nothing is written then
 */
export const addBuild = (guildId: string, build: Build): boolean => {
    const builds = listBuilds(guildId);
    if (builds.length >= maxBuilds || builds.some(b => b.name === build.name))
        return false;
    const guild = guildOf(guildId) ?? { builds: [] };
    save({
        ...state.current.data,
        [guildId]: { ...guild, builds: [...builds, build] },
    });
    return true;
};

/**
 * Removes a build and writes the state file.
 * @param guildId Discord guild ID
 * @param buildName build name
 * @returns false when the guild has no build with that name; nothing is written then
 */
export const removeBuild = (guildId: string, buildName: string): boolean => {
    const guild = guildOf(guildId);
    if (guild === undefined) return false;
    const builds = guild.builds.filter(b => b.name !== buildName);
    if (builds.length === guild.builds.length) return false;
    save({
        ...state.current.data,
        [guildId]: { ...guild, builds },
    });
    return true;
};

/**
 * Sets the status board channel of a guild and writes the state file.
 * @param guildId Discord guild ID
 * @param notify channel and message IDs of the board that was just posted
 */
export const setNotify = (guildId: string, notify: Notify): void => {
    const guilds = guildOf(guildId) ?? { builds: [] };
    save({
        ...state.current.data,
        [guildId]: { ...guilds, notify },
    });
};

/**
 * Clears the status board channel of a guild and writes the state file.
 * @param guildId Discord guild ID
 */
export const clearNotify = (guildId: string): void => {
    const guild = guildOf(guildId);
    if (guild === undefined) return;
    save({
        ...state.current.data,
        [guildId]: { ...guild, notify: undefined },
    });
};

/**
 * Uploads the state file to the backup URL. Never throws; failures are logged as Warn.
 * @param url base URL (with trailing slash) that accepts PUT; nothing happens when unset or empty
 */
export const backup = async (url?: string): Promise<void> => {
    if (url === undefined || url === "") return;
    const body = readJson(state.current.file);
    if (body === undefined) return;
    const stamp = new Date().toISOString().replace(/[-:T]|\.\d+Z$/g, "");
    try {
        const res = await fetch(`${url}mcsrvctl-${stamp}.json`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
        if (res.ok) log("Backup uploaded");
        else log(`Backup failed: ${res.status}`, "Warn");
    } catch (err) {
        log(
            `Backup upload failed: ${err instanceof Error ? err.message : String(err)}`,
            "Warn"
        );
    }
};
