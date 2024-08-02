const config = require('../../../config.json');
const log = require('../../utils/logOutput.cjs');

const getLocalCommands = require('../../utils/getLocalCommands.cjs');

module.exports = async (client, interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

    const localCommands = getLocalCommands();

    if (interaction.isChatInputCommand()) {
        try {
            const commandObject = localCommands.find(
                (cmd) => cmd.name === interaction.commandName
            );

            if (!commandObject) return;

            if (commandObject.devOnly) {
                if (!config.devs.includes(interaction.member.id)) {
                    interaction.reply({
                        content: 'Only developers are allowed to run this command.',
                        ephemeral: true,
                    });
                    return;
                }
            }

            // disabled due to no registration.
            /*
            if (commandObject.testOnly) {
                if (!(interaction.guild.id === config.testServer)) {
                    interaction.reply({
                        content: 'This command cannot be ran here.',
                        ephemeral: true,
                    });
                    return;
                }
            }
            */

            if (commandObject.permissionsRequired?.length) {
                for (const permission of commandObject.permissionsRequired) {
                    if (!interaction.member.permissions.has(permission)) {
                        interaction.reply({
                            content: 'You don\'t enough permissions.',
                            ephemeral: true,
                        });
                        return;
                    }
                }
            }

            if (commandObject.botPermissions?.length) {
                for (const permission of commandObject.botPermissions) {
                    const bot = interaction.guild.members.me;
                    if (!bot.permissions.has(permission)) {
                        interaction.reply({
                            content: 'The bot don\'t have enough permissions.',
                            ephemeral: true,
                        });
                        return;
                    }
                }
            }

            await commandObject.callback(client, interaction);
        } catch (error) {
            log("Error has occurred during running the command.", "Error");
            log(`${error}`, "Error");
        }
    } else {
        try {
            const commandObject = localCommands.find(
                (cmd) => cmd.name === interaction.commandName
            );

            if (!commandObject) return;

            await commandObject.completion(client, interaction);
        } catch (error) {
            log("Error has occurred during completing the command.", "Error");
            log(`${error}`, "Error");
        }
    }
}
