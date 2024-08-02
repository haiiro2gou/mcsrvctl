import api from 'node-mcstatus';

export default async (addr, port = 25565, query = false) => {
    try {
        const status = api.statusJava(addr, port, { query: query, timeout: 5.0 });
        return status;
    } catch (error) {
        log(`${error} (${addr}:${port})`, 'Error');
        return { online: false };
    }
}
