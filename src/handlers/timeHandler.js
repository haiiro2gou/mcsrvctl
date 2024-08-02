import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import log from '../utils/logOutput.cjs';
import cache from '../../cache.json' assert { type: "json" };

export async function queueProcess() {
    if (cache.queue?.length) {
        const q = cache.queue.shift();
        log(`Started processing the start-up queue of server "${q.server}".`);
        fs.writeFileSync(path.join(__dirname, '..', '..', 'cache.json'), JSON.stringify(cache));
        const ssh = new NodeSSH();
        await ssh.connect({
            host: process.env.SERVER_IP,
            port: process.env.SERVER_PORT,
            username: process.env.SSH_USER,
            privateKeyPath: path.join(__dirname, '..', '..', process.env.SSH_PRIVATE),
        })
        await ssh.execCommand(`kubectl scale -n ${process.env.NAMESPACE}-${q.guild} deployment/${q.server} --replicas=1`);
        ssh.dispose();
    }
}

export async function filterServerCache() {
    cache.guilds = cache.guilds.filter((element) => parseInt((new Date() - new Date(element.date)) / 1000 / 60 / 60 / 24) <= 30);
    fs.writeFileSync(path.join(__dirname, '..', '..', 'cache.json'), JSON.stringify(cache));
}
