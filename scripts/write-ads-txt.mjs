// Writes public/ads.txt for AdSense, or removes it when no publisher ID is set.
//
// ads.txt has to live at the root domain, and the root domain is this site,
// so the subdomain services (the diagnosis) are covered by this one file.
// Generated at build time because the site is a static export: a route handler
// could not answer 404 when the ID is missing, and an empty ads.txt is not the
// same as none — it would authorise no sellers at all.
import { rm, writeFile } from "node:fs/promises";

const target = new URL("../public/ads.txt", import.meta.url);
const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();

if (!client) {
  await rm(target, { force: true });
  console.log("ads.txt: NEXT_PUBLIC_ADSENSE_CLIENT is not set, skipped");
} else {
  if (!/^ca-pub-\d{10,20}$/.test(client)) {
    throw new Error(
      `ads.txt: NEXT_PUBLIC_ADSENSE_CLIENT must look like ca-pub-1234567890123456, got "${client}"`,
    );
  }
  const publisher = client.replace(/^ca-/, "");
  await writeFile(target, `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`);
  console.log(`ads.txt: written for ${publisher}`);
}
