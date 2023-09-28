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
        ret.check = true;
    } catch (error) {
        console.log(`Error has occurred during getting server status.\n${error}`);
        ret.check = false;
    }
    return ret;
};
