/**
 * Text of a thrown value for a log line.
 * @param error whatever was caught
 * @returns the message of an Error, else the value as a string
 */
export default function errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    else return String(error);
}
