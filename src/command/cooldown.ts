const last = { current: new Map<string, number>() };
const windowMs = 60_000;

// Returns true and records the time when the build may be operated now.
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
