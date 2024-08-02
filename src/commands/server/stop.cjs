const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');

const config = require('../../../config.json');

module.exports = {
    /**
     * @param { Client } client
     * @param { Interaction } interaction
     */

    name: 'stop',
    description: 'Stops the indicated server.',
    // devOnly: Boolean,
    // testOnly: Boolean,
    options: [
        {
            name: "target-server",
            description: "The server you want to boot.",
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: true,
        },
    ],
    // deleted: Boolean,

    completion: async (client, interaction) => {
        const focusedValue = interaction.options.getFocused();
        const choices = config.guilds.find((guild) => guild.id === interaction.guildId).builds.map((build) => ({ name: build.alias, value: build.name }));
        await interaction.respond(choices.filter((choice) => choice.name.startsWith(focusedValue)));
    },

    callback: async (client, interaction) => {
        const { NodeSSH } = require('node-ssh');
        const log = require('../../utils/logOutput.cjs');
        const { default: getServerStatus } = await import('../../utils/getServerStatus.js');

        await interaction.deferReply();
        const reply = await interaction.fetchReply();
        const target = await interaction.options.get('target-server').value;
        const targetName = config.guilds.filter((element) => element.id === reply.guild.id)[0].builds.find((element) => element.name === target).alias;
        const doer = await client.users.fetch(interaction.member.id);
        log(`[${reply.guild.name}] Server "${targetName}" stop queue from ${doer.username}!`);

        const serverStatus = await getServerStatus(`${target}.${process.env.NAMESPACE}-${config.guilds.filter((element) => element.id === reply.guild.id)[0].id}`);
        if (!serverStatus.online) {
            await interaction.editReply(`This server seems to be offline!`);
            log(`[${reply.guild.name}] Server "${targetName}" is already offline!`, 'Warn');
            return;
        }
        if (serverStatus.online && serverStatus.data.players.online !== 0) {
            await interaction.editReply(`This server appears to have ${serverStatus.players.online} online player(s) connected to it!`);
            log(`[${reply.guild.name}] Server "${targetName}" have ${serverStatus.players.online} online player(s)!`, 'Warn');
            return;
        }

        const ssh = new NodeSSH();
        await ssh.connect({
            host: process.env.SERVER_IP,
            port: process.env.SERVER_PORT,
            username: process.env.SSH_USER,
            privateKey: process.env.SSH_PRIVATE,
        })
        await ssh.execCommand(`kubectl scale -n ${process.env.NAMESPACE}-${reply.guild.id} deployment/${target} --replicas=0`);
        ssh.dispose();
        await interaction.editReply(`Server "${targetName}" stop queued!`);
    }
}
