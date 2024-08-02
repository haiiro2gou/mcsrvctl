import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import config from '../../../config.json' assert { type: "json" };
import log from '../../utils/logOutput.cjs';

import deployCommands from '../ready/01.deployCommand.cjs';

export default async (client, guild) => {
    log(`Joined the guild '${guild.name}' (id: ${guild.id}).`);

    const { default: cache } = await import('../../../cache.json', { assert: { type: "json" } });
    if (cache.guilds?.some((element) => element.id === guild.id)) {
        config.guilds.push(cache.guilds.find((element) => element.id === guild.id));
        delete config.guilds.slice(-1)[0].date;
        log('Cache has been found and the configuration restored.');
    } else {
        config.guilds.push({
            id: guild.id,
            builds: []
        });
        log('Cache has not been found and the configuration generated.');
    }
    fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'config.json'), JSON.stringify(config, null, 4));
    cache.guilds = cache.guilds.filter((element) => element.id !== guild.id);
    fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'cache.json'), JSON.stringify(cache));

    deployCommands(client);
}
