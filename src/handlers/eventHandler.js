import path, { join, relative } from 'path';
import { fileURLToPath } from 'url';
import getAllFiles from '../utils/getAllFiles.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (client) => {
    const eventFolders = getAllFiles(join(__dirname, '..', 'events'), true);

    for (const eventFolder of eventFolders) {
        const eventFiles = getAllFiles(eventFolder);
        eventFiles.sort((a, b) => a > b);

        const eventName = eventFolder.replace(/\\/g, '/').split('/').pop();
        client.on(eventName, async (arg) => {
            for (const eventFile of eventFiles) {
                const { default: eventFunction } = await import(relative(__dirname, eventFile).replace(/\\/g, '/'));
                eventFunction(client, arg);
            }
        });
    }
};
