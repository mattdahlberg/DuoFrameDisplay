#!/usr/bin/env node
// Generates a poster JPG for every .mp4 under public/, extracted at the
// 1 second mark via ffmpeg. Output sits next to the source video as
// `<name>-poster.jpg` - this is the convention PhoneVideo expects
// (see getPosterSrc in src/components/mdx/phone-video.tsx).
//
// Run after adding a new video: `npm run generate-posters`
// Pass --force to regenerate posters that already exist.

import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.join(import.meta.dirname, '..', 'public');
const FORCE = process.argv.includes('--force');
const POSTER_TIMESTAMP = '00:00:01';

async function findMp4Files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findMp4Files(fullPath);
      if (entry.isFile() && entry.name.endsWith('.mp4')) return [fullPath];
      return [];
    }),
  );
  return files.flat();
}

function posterPathFor(videoPath) {
  return videoPath.replace(/\.mp4$/, '-poster.jpg');
}

const videos = await findMp4Files(PUBLIC_DIR);

let generated = 0;
let skipped = 0;

for (const videoPath of videos) {
  const posterPath = posterPathFor(videoPath);
  const relVideo = path.relative(PUBLIC_DIR, videoPath);

  if (!FORCE && existsSync(posterPath)) {
    skipped += 1;
    continue;
  }

  try {
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-ss',
        POSTER_TIMESTAMP,
        '-i',
        videoPath,
        '-frames:v',
        '1',
        '-q:v',
        '3',
        posterPath,
      ],
      { stdio: 'pipe' },
    );
    generated += 1;
    console.log(`generated poster for ${relVideo}`);
  } catch (error) {
    console.error(`failed to generate poster for ${relVideo}`);
    console.error(error.stderr?.toString() ?? error.message);
  }
}

if (statSync(PUBLIC_DIR, { throwIfNoEntry: false }) && videos.length === 0) {
  console.log('no .mp4 files found under public/');
}

console.log(`done - ${generated} generated, ${skipped} skipped (already existed)`);
