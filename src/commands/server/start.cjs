const { exec } = require('child_process');
const { ApplicationCommandOptionType } = require('discord.js');

const getTime = require('../../utils/getTime.cjs');

module.exports = {
    name: 'start',
    description: 'Starts the indicated server.',
    options: [
        {
            name: "target-server",
            description: "The server you want to boot.",
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'Hub',
                    value: 'hub.hub',
                },
                {
                    name: '魔導の箱庭',
                    value: 'temp.hakoniwa',
                },
                {
                    name: 'Spectral Zone',
                    value: 'temp.spectral_zone',
                },
                {
                    name: 'Undertale Arena',
                    value: 'temp.undertale_arena',
                },
            ],
            required: true,
        },
    ],

    callback: async (client, interaction) => {
        const { default: hubSetup } = await import('../../events/ready/02.hubSetup.js');
        const { default: getServerStatus } = await import('../../utils/getServerStatus.js');

        const doer = await client.users.fetch(interaction.member.id);
        const target = await interaction.options.get('target-server').value.split('.', 2);
        console.log(`${getTime(new Date())} Server "${target[1]}" boot queue from ${doer.username}!`);

        await interaction.deferReply();
    
        if (target[0] === 'hub') {
            hubSetup(client);
            return;
        }
        else if (target[0] === 'temp') {
            const tempStatus = await getServerStatus(process.env.SELF_IP, Number(process.env.PORT_TEMP));
            if (tempStatus.data?.players.online) {
                await interaction.editReply(`Error: Someone is connecting to the temporary server.`);
                return;
            }
        }
        else if (target[0] === 'event') {
            const eventStatus = await getServerStatus(process.env.SELF_IP, process.env.PORT_EVENT);
            if (eventStatus.data?.players.online) {
                await interaction.editReply(`Error: Someone is connecting to the event server.`);
                return;
            }
        }
    
        const isWin = process.platform === 'win32';
        if (isWin) {
            exec(`start /d server_builder\\${target[0]}\\${target[1]} boot.bat`);
        } else {
            exec(`screen -UAmdS ${target[1]} bash ./server_builder/${target[0]}/${target[1]}/boot.sh`);
        }
    
        await interaction.editReply(`Startup Queued! (arg: ${target[1]})`);
    },
};
