const getTime = require('../../utils/getTime.cjs');

module.exports = {
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
        console.log(`${getTime(new Date())} Ping from ${doer.username}!`);
    },
};
