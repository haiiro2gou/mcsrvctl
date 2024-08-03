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
        const choices = config.guilds.filter((guild) => (guild.id === interaction.guildId || config.testServer.includes(interaction.guildId))).map((guild) => guild.builds).flat().map((build) => ({ name: build.alias, value: build.name }));
        await interaction.respond(choices.filter((choice) => choice.name.startsWith(focusedValue)));
    },

    callback: async (client, interaction) => {
        const { NodeSSH } = require('node-ssh');
        const log = require('../../utils/logOutput.cjs');
        const { default: getServerStatus } = await import('../../utils/getServerStatus.js');

        await interaction.deferReply();
        const target = await interaction.options.get('target-server').value;
        const doer = await client.users.fetch(interaction.member.id);

        const server = config.guilds.filter((guild) => guild.id === guild.id || config.testServer.includes(guild.id)).map((guild) => guild.builds).flat().find((build) => build.name === target);
        const guild = config.guilds.find((guild) => guild.builds.some((build) => build.name === target));

        const guildName = await client.guilds.cache.get(guild.id).name;

        log(`[${guildName}] Server "${server.alias}" stop queue from ${doer.username}!`);

        const serverStatus = await getServerStatus(`${target}.${process.env.NAMESPACE}-${guild.id}`);

        if (!serverStatus.online) {
            await interaction.editReply(`This server seems to be offline!`);
            log(`[${guildName}] Server "${server.alias}" is already offline!`, 'Warn');
            return;
        }
        if (serverStatus.online && serverStatus.data.players.online !== 0) {
            await interaction.editReply(`This server appears to have ${serverStatus.data.players.online} online player(s) connected to it!`);
            log(`[${guildName}] Server "${server.alias}" have ${serverStatus.data.players.online} online player(s)!`, 'Warn');
            return;
        }

        const ssh = new NodeSSH();
        await ssh.connect({
            host: process.env.SERVER_IP,
            port: process.env.SERVER_PORT,
            username: process.env.SSH_USER,
            privateKey: process.env.SSH_PRIVATE,
        })
        await ssh.execCommand(`kubectl scale -n ${process.env.NAMESPACE}-${guild.id} deployment/${target} --replicas=0`);
        ssh.dispose();
        await interaction.editReply(`Server "${server.alias}" stop queued!`);
    }
}
