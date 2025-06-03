import { type Client } from "discord.js";

import path from "path";
import { getAllFiles } from "../util/io";
import log from "../util/log";

export default (client: Client) => {
    const eventFolders = [
        ...getAllFiles(path.join(process.cwd(), "src", "event"), true),
    ].sort((a, b) => a.localeCompare(b));

    for (const eventFolder of eventFolders) {
        const eventFiles = [...getAllFiles(eventFolder, true)].sort((a, b) =>
            a.localeCompare(b)
        );
        const eventName = path.basename(eventFolder);
        client.on(eventName, arg => {
            for (const eventFile of eventFiles) {
                (async () => {
                    // eslint-disable-next-line no-restricted-syntax
                    const module = (await import(
                        path.relative(process.cwd(), eventFile)
                    )) as {
                        default: (
                            client: Client,
                            arg: unknown
                        ) => Promise<void> | void;
                    };
                    await module.default(client, arg);
                })().catch((err: unknown) => {
                    log(
                        `Error in event handler ${eventName} for file ${eventFile}:`,
                        "Error"
                    );
                    log(String(err), "Error");
                });
            }
        });
    }
};
