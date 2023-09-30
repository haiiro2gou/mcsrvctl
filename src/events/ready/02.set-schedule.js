import got from 'got';
import getServerStatus from './../../utils/getServerStatus.js';
import modifyMessages from './../../utils/modifyMessages.js';

const servData = class {
    constructor(_check, _result) {
        this.check = _check;
        this.data = _result;
    }
}

export default async function eventFunction(client) {
    setInterval(async () => {
        console.log('Started pinging to the server!');
        let result = new servData(5);
    
        try {
            const proxyResponse = await got({ url: `http://${process.env.SELF_IP}:4040/api/tunnels/` });
            const proxyParse = (JSON.parse(proxyResponse.body).tunnels[0].public_url).substring(6).split(':', 2);
            const proxyAddress = proxyParse[0], proxyPort = Number(proxyParse[1]);
            result[0] = await getServerStatus(proxyAddress, proxyPort);
        } catch (error) {
            console.log(`Error has occured during getting response from the proxy:\n ${error}`);
        }
        try {
            const hubAddress = process.env.SELF_IP, hubPort = Number(process.env.SERV_HUB);
            result[1] = await getServerStatus(hubAddress, hubPort);
        } catch (error) {
            console.log(`Error has occured during getting response from the hub server:\n ${error}`);
        }
        try {
            const tempAddress = process.env.HUB_IP, tempPort = Number(process.env.SERV_TEMP);
            result[2] = await getServerStatus(tempAddress, tempPort);
        } catch (error) {
            console.log(`Error has occured during getting response from the temporary server:\n ${error}`);
        }
        try {
            const eventAddress = process.env.HUB_IP, eventPort = Number(process.env.SERV_EVENT);
            result[3] = await getServerStatus(eventAddress, eventPort);
        } catch (error) {
            console.log(`Error has occured during getting response from the event server:\n ${error}`);
        }
    
        modifyMessages(result);
    }, 15000);
};
