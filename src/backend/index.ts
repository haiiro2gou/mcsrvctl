import { docker } from "./docker.js";
import { k8s } from "./k8s.js";

export { NotFoundError, type Backend, type Target } from "./type.js";
export const backend = process.env.BACKEND === "docker" ? docker : k8s;
