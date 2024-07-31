module.exports = (message, attribute = "Info") => {
    const date = new Date();
    const hh = ('00' + date.getHours()).slice(-2), mm = ('00' + date.getMinutes()).slice(-2), ss = ('00' + date.getSeconds()).slice(-2);
    if ((typeof message) !== "string") message = message.toString();
    const messages = message.split('\n');
    for (row of messages) {
        console.log(`[${hh}:${mm}:${ss}] [${attribute}] ${row}`);
    }
}
