const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const k8s = require('@kubernetes/client-node');
const log = require('../../utils/logOutput.cjs');

const config = require('../../../config.json');
const cache = require('../../../cache.json');

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
            choices: config.guilds.filter(server => server.id === cache.cursor)[0].builds.map(build => ({ name: build.alias, value: build.name })),
            required: true,
        },
    ],
    // deleted: Boolean,

    callback: async (client, interaction) => {
        await interaction.reply('WIP');
    }
}
