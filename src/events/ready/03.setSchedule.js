import got from 'got';
import getServerStatus from '../../utils/getServerStatus.js';
import getTime from '../../utils/getTime.cjs';

const servData = class {
    constructor(_check, _result) {
        this.check = _check;
        this.data = _result;
    }
}

export default async (client) => {
    setInterval(async () => {
        console.log(`${getTime(new Date())} Started pinging to the server!`);
        let result = new servData(4);

        try {
            const ngrokResponse = await got({ url: `http://${process.env.SELF_IP}:4040/api/tunnels/` });
            const ngrokParse = (JSON.parse(ngrokResponse.body).tunnels[0].public_url).substring(6).split(':', 2);
            const ngrokAddress = ngrokParse[0], ngrokPort = Number(ngrokParse[1]);
            result[0] = await getServerStatus(ngrokAddress, ngrokPort);
        } catch (error) { result[0] = { check: false }; }
        try {
            const hubAddress = process.env.SELF_IP, hubPort = Number(process.env.PORT_HUB);
            result[1] = await getServerStatus(hubAddress, hubPort);
        } catch (error) { result[1] = { check: false }; }
        try {
            const tempAddress = process.env.HUB_IP, tempPort = Number(process.env.PORT_TEMP);
            result[2] = await getServerStatus(tempAddress, tempPort);
        } catch (error) { result[2] = { check: false }; }
        try {
            const eventAddress = process.env.HUB_IP, eventPort = Number(process.env.PORT_EVENT);
            result[3] = await getServerStatus(eventAddress, eventPort);
        } catch (error) { result[3] = { check: false }; }
    
        try {
            const channel = await client.channels.fetch(`${process.env.STATUS_ID}`);
    
            const title = '## Server Status\n';
            const ngrok = '```' + (input[0].check ? `${input[0].data.ip}` : 'N/A') + '```\n';
            const hub = (input[1].check ? `:green_circle: [Hub] - (${input[1].data?.version.name})\n` : `:red_circle: [Hub] -\n`);
            const temp = (input[2].check ? `:green_circle: [Temp] ${input[2].data?.motd.clean} (${input[2].data?.version.name})\n` : `:red_circle: [Temp] -\n`);
            const event = (input[3].check ? `:green_circle: [Event] ${input[3].data?.motd.clean} (${input[3].data?.version.name})\n` : `:red_circle: [Event] -\n`);
            const time = `\nLast Update: ${new Date()} `;
    
            const messages = await channel.messages.fetch({ limit: 50 });
            const target = messages.find(message => message.author.id === process.env.APP_ID);
            if (target !== undefined) {
                target.edit({ content: `${title + ngrok + hub + temp + event + time}` });
            } else {
                channel.send({ content: `${title + ngrok + hub + temp + event + time}` });
            }
        } catch (error) {
            console.log(`${getTime(new Date())} Error has occurred during modifying server status log.\n${getTime(new Date())} ${error}`);
        }
    
        client.login(process.env.DISCORD_TOKEN);
    }, 60000);
};
