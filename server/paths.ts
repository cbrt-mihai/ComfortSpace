import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, "..");
export const DATA_DIR = path.join(ROOT_DIR, "data", "manga");
export const CACHE_DIR = path.join(ROOT_DIR, ".cache");
export const LIBRARY_PATH = path.join(CACHE_DIR, "library.json");
