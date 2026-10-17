const nameRe = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
export const isName = (s: string): boolean => s.length <= 63 && nameRe.test(s);

const aliasRe = /[@#<>\n\r]/;
export const isAlias = (s: string): boolean =>
    s.length >= 1 && s.length <= 32 && s.trim() === s && !aliasRe.test(s);
