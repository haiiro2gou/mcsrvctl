import { exec } from 'child_process';
import got from 'got';

import getTime from '../../utils/getTime.cjs';

export default async (client) => {
    try {
        await got({ url: `http://${process.env.SELF_IP}:4040/api/tunnels/` });
        console.log(`${getTime(new Date())} Confirmed that ngrok is working.`);
    } catch (error) {
        try {
            exec('start /d server\\ngrok boot.bat');
            console.log(`${getTime(new Date())} ngrok startup queue sent.`);
        } catch (err) {
            console.log(`${getTime(new Date())} ngrok startup process has failed.\n${getTime(new Date())} ${err}`);
        }
    }
}
