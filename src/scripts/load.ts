import { readDataConfig } from "../lib/data/config";
import { loadDataset } from "../lib/data/loader";

// `pnpm load`: rebuilds the data store from the DATA_DIRS roots.
const { roots, dbPath } = readDataConfig();
try {
  const summary = loadDataset({ roots, dbPath });
  console.log(`Loaded ${roots.join(", ")} into ${dbPath}`);
  console.log(summary);
} catch (err) {
  console.error(`Load failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
