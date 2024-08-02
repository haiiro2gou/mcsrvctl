import { MinecraftServerListPing } from 'minecraft-status';

export default async (addr, port = 25565, query = false) => {
    MinecraftServerListPing.ping(4, addr, port, 5000)
    .then((response) => {
        return {
            online: true,
            data: response,
        };
    })
    .catch((error) => {
        log(`${error} (${addr}:${port})`, 'Error');
        return { online: false };
    });
}
