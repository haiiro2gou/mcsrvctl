import path from "node:path";
import { env } from "../env.js";
import { openDb } from "./index.js";

// the one database handle the bot uses; tests open their own with openDb(":memory:")
export const db = openDb(path.join(env.stateDir, "mcsrvctl.db"));
