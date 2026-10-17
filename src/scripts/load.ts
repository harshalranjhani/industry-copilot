import { readDataConfig } from "../lib/data/config";
import { loadDataset } from "../lib/data/loader";

// `pnpm load`: rebuilds the data store from the DATA_DIRS roots, read from .env like the app and the eval runner.
try {
  process.loadEnvFile(".env");
} catch {
  // no .env: the environment must already hold the settings
}
const { roots, dbPath, knowledgePath } = readDataConfig();
try {
  const summary = loadDataset({ roots, dbPath, knowledgePath });
  console.log(`Loaded ${roots.join(", ")} into ${dbPath}`);
  console.log(summary);
} catch (err) {
  console.error(`Load failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
