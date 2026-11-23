// main.ts — the entrypoint the make.fun gate runs for this post-x entry.
//
// Gate contract, in one paragraph: the grader mounts this repository at
// /bot, runs this file with Node 22, and afterwards reads /output/POST.json.
// This program's only job is to hand the gate the address of the X post
// that enters this bounty: it validates the URL inside POST.json, then
// copies that file unchanged into the output directory. It opens no server,
// makes no network request, and writes nothing else, so the run finishes
// immediately and cannot hang the grader.
//
// The entry itself is the X post, not this program: one post from
// @mioimadaX that quotes make.fun's make-your-own-bounty post
// (https://x.com/makefunai/status/2124915864336236646), carries a photo
// of its own, and has make.fun / @makefunai plus the play code
// makefun-plume-mammoth-cattail in its text. POST.json names that post.
//
// Local check (same defaults, pointed at this directory):
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
// ... then out/POST.json is byte for byte this directory's POST.json.

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// A clean X post URL: https://x.com/<handle>/status/<digits> (twitter.com
// accepted too). Anything else — a t.co short link, a URL with query
// parameters, a profile link — is not an entry and is rejected below.
const URL_RE = /^https:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+$/;

const source = join(BOT_DIR, 'POST.json');
let post;
try {
  post = JSON.parse(readFileSync(source, 'utf8'));
} catch {
  console.error(`POST.json not found or unreadable at ${source} — nothing to hand the gate.`);
  process.exit(1);
}

if (typeof post.url !== 'string' || !URL_RE.test(post.url)) {
  console.error(
    'POST.json does not hold a valid X post URL.\n' +
      `  Found: ${JSON.stringify(post)}\n` +
      '  Expected: {"url": "https://x.com/<handle>/status/<digits>"}\n' +
      '  (twitter.com works too; no query parameters, no short links.)',
  );
  process.exit(1);
}

// The placeholder id (all zeroes) passes the shape check above but names
// no real post. Refuse it here so a forgotten placeholder fails loudly
// in the local run instead of silently handing the gate a dead address.
if (/\/status\/0+$/.test(post.url)) {
  console.error(
    'POST.json still holds the placeholder post id (all zeroes).\n' +
      '  Replace it with the real post URL before submitting.',
  );
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
copyFileSync(source, join(OUTPUT_DIR, 'POST.json'));
console.log(`Entry post: ${post.url}`);
console.log(`POST.json copied to ${join(OUTPUT_DIR, 'POST.json')}`);
