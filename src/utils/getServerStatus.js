import got from 'got';
import util from 'minecraft-server-util';
const options = {
    timeout: 1000 * 2,
    enableSRV: true
};

export default async (addr, port) => {
    var check = true;
    try {
        const result = await util.status(addr, port, options);
    } catch (error) {
        console.log(`Error has occurred during getting server status: ${error}`);
        check = false;
    }
    return check;
};
