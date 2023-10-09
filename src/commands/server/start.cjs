const { exec } = require('child_process');
const { ApplicationCommandOptionType } = require('discord.js');
const Rcon = require('rcon');

const { mcServers } = require('../../../config.json');
const getTime = require('../../utils/getTime.cjs');

let lastExec = 0;

module.exports = {
    name: 'start',
    description: 'Starts the indicated server.',
    // devOnly: Boolean,
    // testOnly: Boolean,
    options: [
        {
            name: "target-server",
            description: "The server you want to boot.",
            type: ApplicationCommandOptionType.String,
            choices: mcServers,
            required: true,
        },
    ],
    // deleted: Boolean,

    callback: async (client, interaction) => {
        const { default: hubSetup } = await import('../../events/ready/02.hubSetup.js');
        const { default: getServerStatus } = await import('../../utils/getServerStatus.js');

        const doer = await client.users.fetch(interaction.member.id);
        const target = await interaction.options.get('target-server').value.split('.', 2);
        console.log(`${getTime(new Date())} Server "${target[1]}" boot queue from ${doer.username}!`);

        await interaction.deferReply();

        const elapsed = new Date() - lastExec;
        if (elapsed < 60000) {
            console.log(`${getTime(new Date())} Error: Startup queue on cooldown! (elapsed: ${elapsed}ms)`);
            await interaction.editReply(`This command is on cooldown for 60 seconds.\nRemaining: ${Math.floor((60000 - elapsed) / 1000)}s`);
            return;
        } else {
            lastExec = new Date();
        }
    
        if (target[0] === 'hub') {
            hubSetup(client);
            await interaction.editReply(`Startup Queued! (arg: ${target[1]})`);
            return;
        }

        let serverIP, serverPort, rconPort, rconPass;
        if (target[0] === 'temp') { serverIP = process.env.SELF_IP; serverPort = Number(process.env.PORT_TEMP); rconPort = process.env.RCON_PORT_TEMP; rconPass = process.env.RCON_PASS_TEMP; }
        else if (target[0] === 'event') { serverIP = process.env.SELF_IP; serverPort = Number(process.env.PORT_EVENT); rconPort = process.env.RCON_PORT_EVENT; rconPass = process.env.RCON_PASS_EVENT; }
        const serverStatus = await getServerStatus(serverIP, serverPort);
        if (serverStatus.data?.players.online) {
            await interaction.editReply(`Error: Someone is connecting to the ${target[0]} server.`);
            return;
        } else if (serverStatus.data !== undefined) {
            const rcon = new Rcon(serverIP, rconPort, rconPass);
            rcon.on('auth', function() { rcon.send('stop'); });
            await rcon.connect();
            console.log(`${getTime(new Date())} Server "${target[0]}" stop queue sent.`);
        }

        const isWin = process.platform === 'win32';
        if (isWin) {
            exec(`start /d server\\${target[0]}\\${target[1]} boot.bat`);
        } else {
            exec(`screen -UAmdS ${target[1]} bash ./server/${target[0]}/${target[1]}/boot.sh`);
        }
    
        await interaction.editReply(`Startup Queued! (arg: ${target[1]})`);
    },
};
