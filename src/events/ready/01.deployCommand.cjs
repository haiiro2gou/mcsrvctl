const config = require('../../../config.json');
const cache = require('../../../cache.json');
const fs = require('fs');
const log = require('../../utils/logOutput.cjs');
const path = require('path');

const getLocalCommands = require('../../utils/getLocalCommands.cjs');
const getApplicationCommands = require('../../utils/getApplicationCommands.cjs');
const areCommandsDifferent = require('../../utils/areCommandsDifferent.cjs');

module.exports = async (client) => {
    for (const server of config.guilds) {
        cache.cursor = server.id;
        fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'cache.json'), JSON.stringify(cache));
        try {
            const localCommands = getLocalCommands(undefined,server);
            const applicationCommands = await getApplicationCommands(client, server.id);

            for (const localCommand of localCommands) {
                const { name, description, options } = localCommand;

                const existingCommand = await applicationCommands.cache.find(
                    (cmd) => cmd.name === name
                );

                if (existingCommand) {
                    if (
                        localCommand.deleted ||
                        (
                            localCommand.testOnly &&
                            server.id !== config.testServer
                        )
                    ) {
                        await applicationCommands.delete(existingCommand.id);
                        log(`Deleted command: ${name}`);
                        continue;
                    }

                    if (areCommandsDifferent(existingCommand, localCommand)) {
                        await applicationCommands.edit(existingCommand.id, {
                            description,
                            options,
                        });
                        log(`Edited command: ${name}`);
                    }
                } else {
                    if (localCommand.deleted) {
                        log(`Skipped registering command because of deleted: ${name}`, 'Warn');
                        continue;
                    }

                    if (
                        localCommand.testOnly &&
                        server.id !== config.testServer
                    ) {
                        continue;
                    }

                    await applicationCommands.create({
                        name,
                        description,
                        options,
                    });

                    log(`Registered command: ${name}`);
                }
            }
        } catch (err) {
            log('Error has occurred during deploying local commands.', 'Error');
            log(err, 'Error');
        }
    }
    delete cache.cursor;
    fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'cache.json'), JSON.stringify(cache));
}
