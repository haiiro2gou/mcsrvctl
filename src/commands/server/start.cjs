const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');

const config = require('../../../config.json');

module.exports = {
    /**
     * @param { Client } client
     * @param { Interaction } interaction
     */

    name: 'start',
    description: 'Starts the indicated server.',
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
        const fs = require('fs');
        const path = require('path');
        const log = require('../../utils/logOutput.cjs');
        const { default: getServerStatus } = await import('../../utils/getServerStatus.js');

        let { default: cache } = await import('../../../cache.json', { assert: { type: "json" } });

        await interaction.deferReply();
        const target = await interaction.options.get('target-server').value;
        const doer = await client.users.fetch(interaction.member.id);

        const server = config.guilds.filter((guild) => guild.id === guild.id || config.testServer.includes(guild.id)).map((guild) => guild.builds).flat().find((build) => build.name === target);
        const guild = config.guilds.find((guild) => guild.builds.some((build) => build.name === target));

        const guildName = await client.guilds.cache.get(guild.id).name;

        log(`[${guildName}] Server "${server.alias}" boot queue from ${doer.username}!`);

        const serverStatus = await getServerStatus(`${target}.${process.env.NAMESPACE}-${config.guilds.filter((element) => element.id === guild.id)[0].id}`);

        if (serverStatus.online) {
            await interaction.editReply(`This server is already online!`);
            log(`[${guildName}] Server "${server.alias}" is already online!`, 'Warn');
            return;
        }
        if (cache.queue?.some((element) => element.server === target)) {
            await interaction.editReply(`This queue is already in place.`);
            log(`[${guildName}] Server "${server.alias}" is already startup queued!`, 'Warn');
            return;
        }

        if (!cache.queue?.length) cache.queue = [];
        cache.queue.push({
            guild: guild.id,
            server: target,
        });
        fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'cache.json'), JSON.stringify(cache));
        await interaction.editReply(`Server "${server.alias}" startup queued!`);
    }
}
