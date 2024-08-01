const { Client, Interaction } = require('discord.js');
const log = require('../../utils/logOutput.cjs');

module.exports = {
    /**
     * @param { Client } client
     * @param { Interaction } interaction
     */

    name: 'ping',
    description: 'Pong!',
    // devOnly: Boolean,
    // testOnly: Boolean,
    // options: Object[],
    // deleted: Boolean,

    callback: async (client, interaction) => {
        await interaction.deferReply();

        const reply = await interaction.fetchReply();

        const ping = reply.createdTimestamp - interaction.createdTimestamp;
        interaction.editReply(`Pong! (${ping} ms)`);

        const doer = await client.users.fetch(interaction.member.id);
        log(`[${reply.guild.name}] Ping from ${doer.username}!`);
    },
}
