import util from 'minecraft-server-util';
import getTime from './getTime.cjs';
const options = {
    timeout: 1000 * 2,
    enableSRV: true
};

const servData = class {
    constructor(_check, _result) {
        this.check = _check;
        this.data = _result;
    };
}

export default async (addr, port) => {
    var ret = new servData;
    try {
        ret.data = await util.status(addr, port, options);
        ret.data.ip = `${addr}:${port}`;
        ret.check = true;
    } catch (error) {
        console.log(`${getTime(new Date())}${error} (${addr}:${port})`);
        ret.check = false;
    }
    return ret;
};
