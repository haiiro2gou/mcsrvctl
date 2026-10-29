export default function errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    else return String(error);
}
