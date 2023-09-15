import got from 'got';

export default async (ipAddress) => {
    const response = await got({
        url: 'https://api.mcsrvstat.us/3/' + encodeURIComponent(ipAddress),
    });
    const servData = JSON.parse(response.body);
    if (servData.online) {
        console.log('The proxy is online!');
    } else {
        console.log('The proxy is offline...');
    }
    return servData.online;
};
