/* Stages the static web assets into www/ for Capacitor (webDir: "www").
   The app is served from the repo root in dev (python3 -m http.server); this
   copies just the shippable files so the native bundle stays clean (no api/,
   no node_modules). Run: npm run build:www   (then: npx cap sync) */
import { mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const www = join(root, "www");
mkdirSync(www, { recursive: true });

const ASSETS = ["index.html", "content.js", "manifest.json", "sw.js", "icon-192.png", "icon-512.png"];
for (const a of ASSETS) {
  copyFileSync(join(root, a), join(www, a));
  console.log("copied", a);
}
console.log("www/ ready — next: npx cap sync");
