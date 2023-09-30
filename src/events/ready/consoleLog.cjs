const getTime = require('../../utils/getTime.cjs');

module.exports = (client) => {
    console.log(`${getTime(new Date())}${client.user.tag} is Ready!`);
};
