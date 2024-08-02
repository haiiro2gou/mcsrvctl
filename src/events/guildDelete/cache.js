import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import config from '../../../config.json' assert { type: "json" };
import cache from '../../../cache.json' assert { type: "json" };
import log from '../../utils/logOutput.cjs';

export default async (client, guild) => {
    log(`Left the guild '${guild.name}' (id: ${guild.id}).`);

    if (!cache.guilds?.length) cache.guilds = [];
    cache.guilds.push(config.guilds.filter((element) => element.id === guild.id)[0]);
    const merger = { date: (new Date()).toISOString() };
    Object.assign(cache.guilds.slice(-1)[0], merger);
    fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'cache.json'), JSON.stringify(cache));
    config.guilds = config.guilds.filter((element) => element.id !== guild.id);
    fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'config.json'), JSON.stringify(config, null, 4));
    log('Configuration is recorded in the cache.');
    log('This cache will be deleted after one month.');
}
