import got from 'got';
import getServerStatus from '../../utils/getServerStatus.js';
import getTime from '../../utils/getTime.cjs';
import modifyMessages from '../../utils/modifyMessages.js';

const servData = class {
    constructor(_check, _result) {
        this.check = _check;
        this.data = _result;
    }
}

export default async (client) => {
    setInterval(async () => {
        console.log(`${getTime(new Date())} Started pinging to the server!`);
        let result = new servData(5);
    
        try {
            const ngrokResponse = await got({ url: `http://${process.env.SELF_IP}:4040/api/tunnels/` });
            const ngrokParse = (JSON.parse(ngrokResponse.body).tunnels[0].public_url).substring(6).split(':', 2);
            const ngrokAddress = ngrokParse[0], ngrokPort = Number(ngrokParse[1]);
            result[0] = await getServerStatus(ngrokAddress, ngrokPort);
        } catch (error) { result[0] = { check: false, data: {} }; }
        try {
            const hubAddress = process.env.SELF_IP, hubPort = Number(process.env.PORT_HUB);
            result[2] = await getServerStatus(hubAddress, hubPort);
        } catch (error) { result[2] = { check: false, data: {} }; }
        try {
            const tempAddress = process.env.HUB_IP, tempPort = Number(process.env.PORT_TEMP);
            result[3] = await getServerStatus(tempAddress, tempPort);
        } catch (error) { result[3] = { check: false, data: {} }; }
        try {
            const eventAddress = process.env.HUB_IP, eventPort = Number(process.env.PORT_EVENT);
            result[4] = await getServerStatus(eventAddress, eventPort);
        } catch (error) { result[4] = { check: false, data: {} }; }
    
        modifyMessages(client, result);
    }, 60000);
};
