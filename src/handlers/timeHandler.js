import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import log from '../utils/logOutput.cjs';
import config from '../../config.json' assert { type: "json" };

import getServerStatus from '../utils/getServerStatus.js';

export async function queueProcess() {
    const { default: cache } = await import('../../cache.json', { assert: { type: "json" } });
    if (cache.queue?.length) {
        const q = cache.queue.shift();
        log(`Started processing the start-up queue of server "${q.server}".`);
        fs.writeFileSync(path.join(__dirname, '..', '..', 'cache.json'), JSON.stringify(cache));
        const ssh = new NodeSSH();
        await ssh.connect({
            host: process.env.SERVER_IP,
            port: process.env.SERVER_PORT,
            username: process.env.SSH_USER,
            privateKey: process.env.SSH_PRIVATE,
        })
        await ssh.execCommand(`kubectl scale -n ${process.env.NAMESPACE}-${q.guild} deployment/${q.server} --replicas=1`);
        ssh.dispose();
    }
}

export async function filterServerCache() {
    const { default: cache } = await import('../../cache.json', { assert: { type: "json" } });
    cache.guilds = cache.guilds.filter((element) => parseInt((new Date() - new Date(element.date)) / 1000 / 60 / 60 / 24) <= 30);
    fs.writeFileSync(path.join(__dirname, '..', '..', 'cache.json'), JSON.stringify(cache));
}

export async function updateServerStatus(client) {
    const { default: cache } = await import('../../cache.json', { assert: { type: "json" } });
    let notifyLog = [];

    for (const guild of config.guilds) {
        let result = [];
        for (const build of guild.builds) {
            const status = await getServerStatus(`${build.name}.${process.env.NAMESPACE}-${guild.id}`);
            result.push({
                name: build.alias,
                online: status.online,
                players: status.data?.players?.online || 0,
                max: status.data?.players?.max || 0,
                // motd: status.data?.description.text.replace(/\n/, ' ') || "",
            });
        }

        if (!config.testServer.includes(guild.id)) {
            await updateLog(client, guild, result);
        }

        notifyLog.push({
            id: guild.id,
            data: result,
        });
    }

    for (const guild of config.guilds.filter((element) => config.testServer.includes(element.id))) {
        await updateLog(client, guild, notifyLog.map((element) => element.data).flat());
    }

    cache.notification = notifyLog;
    fs.writeFileSync(path.join(__dirname, '..', '..', 'cache.json'), JSON.stringify(cache));
}

async function updateLog(client, guild, status) {
    let { default: cache } = await import('../../cache.json', { assert: { type: "json" } });
    const current = cache.notification.filter((element) => element.id === guild.id || config.testServer.includes(guild.id)).map((element) => element.data).flat();

    let check = true;
    if (current.length !== status.length) check = false;
    for (const data of status) {
        if (!current.some((element) => element.name === data.name)) {
            check = false;
            data.update = new Date().toString();
            continue;
        }
        const compr = current.find((element) => element.name === data.name);
        data.update = compr.update;
        if (
            compr.name !== data.name ||
            compr.online !== data.online ||
            compr.players !== data.players ||
            compr.max !== data.max // ||
            // compr.motd !== data.motd
        ) {
            check = false;
            data.update = new Date().toString();
            continue;
        }
        if (data.online && (new Date() - new Date(compr.update)) / 1000 / 60 / 60 >= 1) {
            log(`Server "${data.name}" stop queued!`);

            const ssh = new NodeSSH();
            await ssh.connect({
                host: process.env.SERVER_IP,
                port: process.env.SERVER_PORT,
                username: process.env.SSH_USER,
                privateKey: process.env.SSH_PRIVATE,
            });
            await ssh.execCommand(`kubectl scale -n ${process.env.NAMESPACE}-${guild.id} deployment/${config.guilds.find((element) => element.id === guild.id).builds.find((element) => element.alias === data.name).name} --replicas=0`);
            ssh.dispose();
        }
    }

    if (!check) {
        const guildName = await client.guilds.cache.get(guild.id).name;
        log(`[${guildName}] Server data has been updated due to inactiveness!`);

        let content = `## Server Status\n\`\`\`${process.env.IP_ALIAS}\`\`\`\n`;
        for (const data of status) {
            if (data.online) {
                content += `:green_circle: [${data.name}] ${data.players}/${data.max} Players Online\n`;
            } else if (config.guilds.find((element) => element.builds.some((build) => build.alias === data.name)).builds.find((element) => element.alias === data.name).display) {
                content += `:red_circle: [${data.name}] -\n`;
            }
        }
        content += `\nLast Update: ${new Date().toString()}\n`;

        for (const notifyId of guild.notification) {
            const channel = await client.channels.fetch(`${notifyId}`);
            const messages = await channel.messages.fetch({ limit: 25 });
            const target = messages.find((message) => message.author.id === process.env.APP_ID);

            if (target !== undefined) {
                target.edit(content);
            } else {
                channel.send(content);
            }
        }
    }
}
