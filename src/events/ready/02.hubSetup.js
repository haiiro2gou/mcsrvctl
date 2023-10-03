import { exec } from 'child_process';
import getServerStatus from '../../utils/getServerStatus.js';
import getTime from '../../utils/getTime.cjs';

export default async (client) => {
    const isWin = process.platform === 'win32';
    const proxy = await getServerStatus(process.env.SELF_IP, Number(process.env.PORT_PROXY));
    const hub = await getServerStatus(process.env.SELF_IP, Number(process.env.PORT_HUB));

    if (!proxy.check) {
        try {
            if (isWin) exec('start /d server_builder\\proxy boot.bat');
            else exec('screen -UAmdS proxy bash ./server_builder/proxy/boot.sh');
            console.log(`${getTime(new Date())} Proxy startup queue sent.`);
        } catch (error) {
            console.log(`${getTime(new Date())} Error has occurred during the startup of the proxy. \n${getTime(new Date())} ${error}`);
        }
    }
    if (!hub.check) {
        try {
            if (isWin) exec('start /d server_builder\\hub boot.bat');
            else exec('screen -UAmdS hub bash ./server_builder/hub/boot.sh');
            console.log(`${getTime(new Date())} Hub startup queue sent.`);
        } catch (error) {
            console.log(`${getTime(new Date())} Error has occurred during the startup of the hub. \n${getTime(new Date())} ${error}`);
        }
    }
}
