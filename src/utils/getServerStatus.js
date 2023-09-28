import got from 'got';
import util from 'minecraft-server-util';
const options = {
    timeout: 1000 * 5,
    enableSRV: true
};

export default async (addr, port) => {
    try {
        const result = await util.status(addr, port, options);
    } catch (error) {
        console.log(`Error has occurred during getting server status: ${error}`);
    }
};
