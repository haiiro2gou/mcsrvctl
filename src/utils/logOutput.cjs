module.exports = (text, attribute = "Info") => {
    const date = new Date();
    const hh = ('00' + date.getHours()).slice(-2), mm = ('00' + date.getMinutes()).slice(-2), ss = ('00' + date.getSeconds()).slice(-2);
    console.log(`[${hh}:${mm}:${ss}] [${attribute}] ${text}`);
}
