/**
 * Logs a message to the console with a timestamp and log level.
 * @param content content to log, can be a string or an array of strings
 * @param attribute type of log, defaults to "Info"
 */

export default function log(
    content: string | string[],
    attribute = "Info"
): void {
    const _content = [content].flat();
    const date = new Date();
    const hh = `00${date.getHours()}`.slice(-2),
        mm = `00${date.getMinutes()}`.slice(-2),
        ss = `00${date.getSeconds()}`.slice(-2);
    _content.forEach(line => {
        console.log(`[${hh}:${mm}:${ss}] [${attribute}] ${line}`);
    });
}
