import { type Status } from "./status.js";

/** Idle bookkeeping of one server between two pings. */
export interface IdleState {
    last?: Status;
    idleSince?: number;
}
const idleMs = 60 * 60 * 1000;

/**
 * Advances the idle state with one ping result.
 * A server counts as idle only while it answers with 0 players; an offline or failed ping resets the timer.
 * @param state previous idle state ({} for a server seen for the first time)
 * @param status result of the ping just taken
 * @param now current time in ms
 * @returns the next state, and stop = true when the server has been empty for an hour
 */
export const next = (
    state: IdleState,
    status: Status,
    now: number
): { state: IdleState; stop: boolean } => {
    if (!status.online || status.players > 0)
        return { state: { last: status }, stop: false };
    const idleSince = state.idleSince ?? now;
    if (now - idleSince >= idleMs)
        return { state: { last: status }, stop: true };
    return { state: { last: status, idleSince }, stop: false };
};
