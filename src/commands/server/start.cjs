const log = require('../../utils/logOutput.cjs');
const { ApplicationCommandOptionType } = require('discord.js');
const k8s = require('@kubernetes/client-node');

const config = require('../../../config.json');
const cache = require('../../../cache.json');

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
            choices: config.servers.filter(server => server.id === cache.cursor)[0].builds.map(build => ({ name: build.alias, value: build.name })),
            required: true,
        },
    ],
    // deleted: Boolean,

    callback: async (client, interaction) => {
        await interaction.reply('WIP');
    }
}
