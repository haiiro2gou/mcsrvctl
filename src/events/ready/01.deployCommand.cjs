const { testServer } = require('../../../config.json');
const areCommandsDifferent = require('../../utils/areCommandsDifferent.cjs');
const getApplicationCommands = require('../../utils/getApplicationCommands.cjs');
const getLocalCommands = require('../../utils/getLocalCommands.cjs');
const getTime = require('../../utils/getTime.cjs');

module.exports = async (client) => {
    try {
        const localCommands = getLocalCommands();
        const applicationCommands = await getApplicationCommands(client, testServer);

        for (const localCommand of localCommands) {
            const { name, description, options } = localCommand;

            const existingCommand = await applicationCommands.cache.find(
                (cmd) => cmd.name === name
            );

            if (existingCommand) {
                if (localCommand.deleted) {
                    await applicationCommands.delete(existingCommand.id);
                    console.log(`${getTime(new Date())} Deleted command: ${name}`);
                    continue;
                }

                if (areCommandsDifferent(existingCommand, localCommand)) {
                    await applicationCommands.edit(existingCommand.id, {
                        description,
                        options,
                    });

                    console.log(`${getTime(new Date())} Edited command: ${name}`);
                }
            } else {
                if (localCommand.deleted) {
                    console.log(`${getTime(new Date())} Skipped registering command because of deleted: ${name}`);
                    continue;
                }

                await applicationCommands.create({
                    name,
                    description,
                    options,
                });

                console.log(`${getTime(new Date())} Registered command: ${name}`);
            }
        }
    } catch (error) {
        console.log(`${getTime(new Date())} Error has occurred during deploying local commands.\n ${error}`);
    }
};
