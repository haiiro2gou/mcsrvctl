import getTime from './getTime.cjs';

export default async (client, input) => {
    try {
        const channel = await client.channels.fetch(`${process.env.STATUS_ID}`);

        const title = '## Server Status\n';
        const ngrok = '```' + (input[0].check ? `${input[0].data.ip}` : 'N/A') + '```\n';
        const hub = (input[2].check ? `:green_circle: [Hub] - (${input[2].data?.version.name})\n` : `:red_circle: [Hub] -\n`);
        const temp = (input[3].check ? `:green_circle: [Temp] ${input[3].data?.motd.clean} (${input[3].data?.version.name})\n` : `:red_circle: [Temp] -\n`);
        const event = (input[4].check ? `:green_circle: [Event] ${input[4].data?.motd.clean} (${input[4].data?.version.name})\n` : `:red_circle: [Event] -\n`);
        const time = `\nLast Update: ${new Date()} `;

        const messages = await channel.messages.fetch({ limit: 50 });
        const target = messages.find(message => message.author.id === process.env.APP_ID);
        if (target !== undefined) {
            target.edit({ content: `${title + ngrok + hub + temp + event + time}` });
        } else {
            channel.send({ content: `${title + ngrok + hub + temp + event + time}` });
        }
    } catch (error) {
        console.log(`${getTime(new Date())} Error has occurred during modifying server status log.\n${error}`);
    }

    client.login(process.env.DISCORD_TOKEN);
}

