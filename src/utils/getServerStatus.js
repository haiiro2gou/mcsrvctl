import util from 'minecraft-server-util';
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
        console.log(`${error} (${addr}:${port})`);
        ret.check = false;
    }
    return ret;
};
