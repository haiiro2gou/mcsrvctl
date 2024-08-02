import { MinecraftServerListPing } from 'minecraft-status';
import log from '../utils/logOutput.cjs';

export default async (addr, port = 25565, query = false) => {
    let status = {
        online: false,
    };
    await MinecraftServerListPing.ping(4, addr, port, 5000)
    .then((response) => {
        status.online = true;
        status.data = response;
    })
    .catch((error) => {
        log(`${error} (${addr}:${port})`, 'Error');
    });
    return status;
}
