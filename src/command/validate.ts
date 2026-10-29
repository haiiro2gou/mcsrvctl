const nameRe = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
/**
 * Checks a server name: a DNS label, as it names a Deployment or a container.
 * @param str text the user typed
 * @returns true for 1 to 63 lowercase letters, digits and hyphens, not starting or ending with a hyphen
 */
export const isName = (str: string): boolean =>
    str.length <= 63 && nameRe.test(str);

const aliasRe = /[@#<>\n\r]/;
/**
 * Checks a display alias, which is shown back in Discord messages.
 * @param str text the user typed
 * @returns true for 1 to 32 characters with no surrounding spaces, line breaks, or the mention and channel characters @ # < >
 */
export const isAlias = (str: string): boolean =>
    str.length >= 1 &&
    str.length <= 32 &&
    str.trim() === str &&
    !aliasRe.test(str);
