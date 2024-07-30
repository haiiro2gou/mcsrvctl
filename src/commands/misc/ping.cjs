const log = require('../../utils/logOutput.cjs');

module.exports = {
    name: 'ping',
    description: 'Pong!',
    // devOnly: boolean,
    // testOnly: Boolean,
    // options: Object[],
    // deleted: Boolean,

    callback: async (client, interaction) => {
        await interaction.deferReply();

        const reply = await interaction.fetchReply();

        const ping = reply.createdTimestamp - interaction.createdTimestamp;
        interaction.editReply(`Pong! (${ping} ms)`);

        const doer = await client.users.fetch(interaction.member.id);
        log(`Ping from ${doer.username}!`);
    },
}
