// name : Deployment / container name
const nameRe = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
export const isName = (s: string): boolean => s.length <= 63 && nameRe.test(s);

// alias : User-defined name for the server, used in Discord messages
const aliasRe = /[@#<>\n\r]/;
export const isAlias = (s: string): boolean =>
    s.length >= 1 && s.length <= 32 && s.trim() === s && !aliasRe.test(s);
