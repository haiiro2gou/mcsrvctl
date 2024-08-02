const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../../config.json');
const log = require('../../utils/logOutput.cjs');

module.exports = {
    /**
     * @param { Client } client
     * @param { Interaction } interaction
     */

    name: 'config',
    description: 'Configure features of this bot on the server. (WIP)',
    devOnly: true,
    testOnly: true,
    options: [
        {
            name: 'key',
            description: 'Key to configure.',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'Curseforge API Key',
                    value: 'cf_api_key',
                }
            ],
            required: true,
        },
        {
            name: 'value',
            description: 'Value to be set.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    // deleted: Boolean,

    callback: async (client, interaction) => {
        await interaction.deferReply();

        const key = await interaction.options.get('key');
        const value = await interaction.options.get('value');
        const reply = await interaction.fetchReply();
        const doer = await client.users.fetch(interaction.member.id);

        if (key.value === 'cf_api_key') {
            await interaction.editReply(`Configuration "Curseforge API Key" has been changed!`);
            config.guilds.filter((element) => element.id === reply.guild.id)[0].forge.cf_api_key = Buffer.from(value.value).toString('base64');
            fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'config.json'), JSON.stringify(config, null, 4));
            log(`[${reply.guild.name}] Configuration "cf_api_key" has been changed by the command "config" from ${doer.username}.`)
            return;
        }

        log(`[${reply.guild.name}] Command "config" was executed with wrong arguments by ${doer.username}.`, 'Warn')
        await interaction.editReply('Invalid argument.');
    }
}
