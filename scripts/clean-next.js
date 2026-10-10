// Pre-dev cache guard. `next dev` and `next build` share the `.next`
// directory but write incompatible chunk graphs — starting dev on top of a
// production build (or vice versa) produces "Cannot find module './N.js'"
// and PackFileCache ENOENT errors that only a clean fixes. Deleting `.next`
// is always safe (gitignored build output); the cost is one cold compile.
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", ".next");
try {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("[dev] cleared stale .next cache");
} catch (err) {
  console.warn("[dev] could not clear .next (continuing anyway):", err);
}
