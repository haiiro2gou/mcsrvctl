const { Client, Interaction } = require('discord.js');
const log = require('../../utils/logOutput.cjs');

module.exports = {
    /**
     * @param { Client } client
     * @param { Interaction } interaction
     */

    name: 'kill',
    description: 'Kill the bot process',
    devOnly: true,
    testOnly: true,
    // options: Object[],
    // deleted: Boolean,

    callback: async (client, interaction) => {
        await interaction.deferReply();
        await interaction.editReply(`Killing the process...`);

        const doer = await client.users.fetch(interaction.member.id);
        log(`Kill command from ${doer.username}.`);
        process.exit(0);
    },
}
