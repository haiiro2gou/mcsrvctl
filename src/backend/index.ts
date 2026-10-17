import { env } from "../env.js";
import { docker } from "./docker.js";
import { k8s } from "./k8s.js";
import { type Backend } from "./type.js";

export { NotFoundError, type Backend, type Target } from "./type.js";

export const backend: Backend = env.backend === "docker" ? docker : k8s;
