const { ApplicationCommandOptionType } = require('discord.js');
const Rcon = require('rcon');

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
                    value: 'Hub',
                },
                {
                    name: 'Temporary',
                    value: 'Temporary',
                },
                {
                    name: 'Event',
                    value: 'Event',
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
        console.log(`${getTime(new Date())} ${target} server stop queue from ${doer.username}!`);

        await interaction.deferReply();

        let serverIP, serverPort, rconPass;
        if (target === 'Hub') { serverIP = process.env.HUB_IP; serverPort = Number(process.env.PORT_HUB); rconPass = process.env.RCON_HUB; }
        else if (target === 'Temp') { serverIP = process.env.SELF_IP; serverPort = Number(process.env.PORT_TEMP); rconPass = process.env.RCON_TEMP; }
        else if (target === 'Event') { serverIP = process.env.SELF_IP; serverPort = Number(process.env.PORT_EVENT); rconPass = process.env.RCON_EVENT; }
        const serverStatus = await getServerStatus(serverIP, serverPort);
        if (serverStatus.data === undefined) {
            await interaction.editReply(`${target} server is already offline!`);
            return;
        }
        const rcon = new Rcon(serverIP, serverPort + 10, rconPass);
        rcon.on('auth', function() {
            rcon.send('stop');
        });
        await rcon.connect();

        await interaction.editReply(`Server stop queued! ${target}`);
    },
};
