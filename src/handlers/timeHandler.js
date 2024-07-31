import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import cache from '../../cache.json' assert { type: "json" };

export default () => {
    cache.guilds = cache.guilds.filter((element) => parseInt((new Date() - new Date(element.date)) / 1000 / 60 / 60 / 24) <= 30);
    fs.writeFileSync(path.join(__dirname, '..', '..', 'cache.json'), JSON.stringify(cache));
}
