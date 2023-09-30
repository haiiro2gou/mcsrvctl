module.exports = (date) => {
    const hh = ('00' + date.getHours()).slice(-2);
    const mm = ('00' + date.getMinutes()).slice(-2);
    const ss = ('00' + date.getSeconds()).slice(-2);

    return `[${hh}:${mm}:${ss}]`;
}
