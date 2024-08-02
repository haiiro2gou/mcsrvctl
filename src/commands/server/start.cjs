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
        const choices = config.guilds.find((guild) => guild.id === interaction.guildId).builds.map((build) => ({ name: build.alias, value: build.name }));
        await interaction.respond(choices.filter((choice) => choice.name.startsWith(focusedValue)));
    },

    callback: async (client, interaction) => {
        const fs = require('fs');
        const path = require('path');
        const log = require('../../utils/logOutput.cjs');
        const { default: getServerStatus } = await import('../../utils/getServerStatus.js');

        let { default: cache } = await import('../../../cache.json', { assert: { type: "json" } });

        await interaction.deferReply();
        const reply = await interaction.fetchReply();
        const target = await interaction.options.get('target-server').value;
        const targetName = config.guilds.filter((element) => element.id === reply.guild.id)[0].builds.find((element) => element.name === target).alias;
        const doer = await client.users.fetch(interaction.member.id);
        log(`[${reply.guild.name}] Server "${targetName}" boot queue from ${doer.username}!`);

        const serverStatus = getServerStatus(`${target}.${process.env.NAMESPACE}-${config.guilds.filter((element) => element.id === reply.guild.id)[0].id}`);
        if (serverStatus.online) {
            await interaction.editReply(`This server is already online!`);
            log(`[${reply.guild.name}] Server "${targetName}" is already online!`, 'Warn');
            return;
        }

        if (cache.queue?.some((element) => element.server === target)) {
            await interaction.editReply(`This queue is already in place.`);
            log(`[${reply.guild.name}] Server "${targetName}" is already startup queued!`, 'Warn');
            return;
        }

        if (!cache.queue?.length) cache.queue = [];
        cache.queue.push({
            guild: reply.guild.id,
            server: target,
        });
        fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'cache.json'), JSON.stringify(cache));
        await interaction.editReply(`Server "${targetName}" startup queued!`);
    }
}
