const { ApplicationCommandOptionType } = require('discord.js');
const Rcon = require('rcon');

const capitalize = require(`../../utils/capitalize.cjs`);
const getTime = require('../../utils/getTime.cjs');

module.exports = {
    name: 'stop',
    description: 'Stops the indicated server.',
    // devOnly: Boolean,
    // testOnly: Boolean,
    options: [
        {
            name: 'target-server',
            description: 'The server you want to stop.',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'Hub',
                    value: 'hub',
                },
                {
                    name: 'Temporary',
                    value: 'temp',
                },
                {
                    name: 'Event',
                    value: 'event',
                },
            ],
            required: true,
        },
    ],
    // deleted: Boolean,

    callback: async (client, interaction) => {
        const { default: getServerStatus } = await import('../../utils/getServerStatus.js');

        const doer = await client.users.fetch(interaction.member.id);
        const target = await interaction.options.get('target-server').value;
        console.log(`${getTime(new Date())} ${capitalize(target)} server stop queue from ${doer.username}!`);

        await interaction.deferReply();

        let serverIP, serverPort, rconPort, rconPass;
        if (target === 'hub') { serverIP = process.env.HUB_IP; serverPort = Number(process.env.PORT_HUB); rconPort = process.env.RCON_PORT_HUB; rconPass = process.env.RCON_PASS_HUB; }
        else if (target === 'temp') { serverIP = process.env.SELF_IP; serverPort = Number(process.env.PORT_TEMP); rconPort = process.env.RCON_PORT_TEMP; rconPass = process.env.RCON_PASS_TEMP; }
        else if (target === 'event') { serverIP = process.env.SELF_IP; serverPort = Number(process.env.PORT_EVENT); rconPort = process.env.RCON_PORT_EVENT; rconPass = process.env.RCON_PASS_EVENT; }
        const serverStatus = await getServerStatus(serverIP, serverPort);
        if (!serverStatus.check) {
            await interaction.editReply(`${capitalize(target)} server is already offline!`);
            return;
        }
        const rcon = new Rcon(serverIP, rconPort, rconPass);
        rcon.on('auth', function() { rcon.send('stop'); });
        await rcon.connect();

        await interaction.editReply(`Server stop queued! (arg: ${target})`);
    },
};
