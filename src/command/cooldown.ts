const last = { current: new Map<string, number>() };
const windowMs = 60 * 1000;

/**
 * Rate-limits start and stop to one per server per minute.
 * @param guildId Discord guild ID
 * @param name server name
 * @param now current time in ms; a parameter so tests can move the clock
 * @returns true and records the time when the last accepted operation is a minute or more ago, else false
 */
export const accept = (
    guildId: string,
    name: string,
    now = Date.now()
): boolean => {
    const key = `${guildId}/${name}`;
    const previous = last.current.get(key);
    if (previous !== undefined && now - previous < windowMs) return false;
    last.current.set(key, now);
    return true;
};
