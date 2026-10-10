export interface Target {
    guildId: string;
    name: string;
}

export interface Backend {
    start: (target: Target) => Promise<void>;
    stop: (target: Target) => Promise<void>;
    exists: (target: Target) => Promise<boolean>;
    host: (target: Target) => string; // ping
}

export class NotFoundError extends Error {
    constructor(what: string) {
        super(`not found: ${what}`);
        this.name = "NotFoundError";
    }
}
