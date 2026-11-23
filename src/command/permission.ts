import { PermissionFlagsBits } from "discord.js";

/** Default for /start and /stop: everyone. Guilds can narrow it in Server Settings → Integrations. */
export const operate = null;
/** Default for /server and /notify, and the check for /stop force (not overridable in Integrations). */
export const manage = PermissionFlagsBits.ManageGuild;
