#!/usr/bin/env tsx
/**
 * Expand YouTube playlists into individual Video entries.
 *
 * Setup:
 *   1. Enable "YouTube Data API v3" in Google Cloud Console
 *   2. Create an API key (Credentials > Create credentials > API key)
 *   3. Add to .env.local:  YOUTUBE_API_KEY="your-key"
 *
 * Single-playlist mode (prints to stdout):
 *   npm run import-playlist -- <playlistUrlOrId> --topic <topic-id>
 *   npm run import-playlist -- <playlistUrlOrId> --topic <topic-id> --out videos.json
 *
 * --all mode (auto-detects every playlist entry in libraryData.ts):
 *   npm run import-playlist -- --all
 *   npm run import-playlist -- --all --out src/data/expanded-videos.json
 *
 *   Output is a complete videos[] array: existing single videos kept as-is,
 *   playlist entries replaced by their expanded children.
 */
import { config as loadEnv } from 'dotenv';
import { writeFile } from 'fs/promises';

// Vite convention: .env.local takes precedence over .env
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error('Missing YOUTUBE_API_KEY in .env.local');
  process.exit(1);
}

interface PlaylistItem {
  snippet: {
    title: string;
    videoOwnerChannelTitle?: string;
    channelTitle?: string;
    thumbnails?: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
    resourceId: { videoId: string };
  };
}

interface VideoDetails {
  id: string;
  contentDetails: { duration: string };
}

interface OutputVideo {
  id: string;
  title: string;
  channel: string;
  youtube_url: string;
  youtube_id: string;
  thumbnail: string;
  topic: string;
  duration: string;
  topic_id: string;
}

function parsePlaylistArg(arg: string): string {
  try {
    const u = new URL(arg);
    const list = u.searchParams.get('list');
    if (list) return list;
  } catch {}
  return arg;
}

function isoDurationToHuman(iso: string): string {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return '';
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
}

async function fetchAllPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = [];
  let pageToken = '';
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('playlistId', playlistId);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', API_KEY!);

    const res = await fetch(url.toString());
    const data = (await res.json()) as { items?: PlaylistItem[]; nextPageToken?: string; error?: { message: string } };
    if (data.error) throw new Error(data.error.message);
    items.push(...(data.items || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return items;
}

async function fetchVideoDurations(videoIds: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('id', chunk.join(','));
    url.searchParams.set('key', API_KEY!);

    const res = await fetch(url.toString());
    const data = (await res.json()) as { items?: VideoDetails[]; error?: { message: string } };
    if (data.error) throw new Error(data.error.message);
    for (const item of data.items || []) {
      out[item.id] = isoDurationToHuman(item.contentDetails.duration);
    }
  }
  return out;
}

function buildVideo(
  it: PlaylistItem,
  idx: number,
  playlistId: string,
  topicId: string,
  durations: Record<string, string>
): OutputVideo {
  const id = it.snippet.resourceId.videoId;
  const thumb =
    it.snippet.thumbnails?.high?.url ||
    it.snippet.thumbnails?.medium?.url ||
    it.snippet.thumbnails?.default?.url ||
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return {
    id: `vid-${playlistId}-${idx}`,
    title: it.snippet.title,
    channel: it.snippet.videoOwnerChannelTitle || it.snippet.channelTitle || '',
    youtube_url: `https://www.youtube.com/watch?v=${id}&list=${playlistId}&index=${idx + 1}`,
    youtube_id: id,
    thumbnail: thumb,
    topic: '',
    duration: durations[id] || '',
    topic_id: topicId,
  };
}

async function expandPlaylist(playlistId: string, topicId: string): Promise<OutputVideo[]> {
  const items = await fetchAllPlaylistItems(playlistId);
  const valid = items.filter((it) => it.snippet?.resourceId?.videoId);
  const videoIds = valid.map((it) => it.snippet.resourceId.videoId);
  const durations = await fetchVideoDurations(videoIds);
  return valid.map((it, idx) => buildVideo(it, idx, playlistId, topicId, durations));
}

function parseArgs(argv: string[]) {
  const args: { positional: string[]; topic?: string; out?: string; all: boolean } = {
    positional: [],
    all: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--topic') args.topic = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else args.positional.push(a);
  }
  return args;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

async function runSingle(playlistId: string, topicId: string, outFile?: string) {
  console.error(`Fetching playlist ${playlistId}...`);
  const videos = await expandPlaylist(playlistId, topicId);
  console.error(`  → ${videos.length} videos`);
  const json = JSON.stringify(videos, null, 2);
  if (outFile) {
    await writeFile(outFile, json + '\n');
    console.error(`Wrote ${videos.length} videos to ${outFile}`);
  } else {
    process.stdout.write(json + '\n');
  }
}

async function runAll(outFile: string) {
  const mod = await import('../src/data/libraryData');
  const existing = (mod.libraryData?.videos ?? []) as OutputVideo[];

  const singleVideos = existing.filter((v) => v.youtube_id && v.youtube_id.length > 0);
  const playlistEntries = existing.filter(
    (v) => (!v.youtube_id || v.youtube_id.length === 0) && v.youtube_url?.includes('list=')
  );

  console.error(`Found ${existing.length} total entries in libraryData.videos`);
  console.error(`  - ${singleVideos.length} single videos (kept as-is)`);
  console.error(`  - ${playlistEntries.length} playlist entries (expanding)\n`);

  if (playlistEntries.length === 0) {
    console.error('Nothing to expand.');
    return;
  }

  const expanded: OutputVideo[] = [];
  let okCount = 0;
  let failCount = 0;
  const failures: { title: string; error: string }[] = [];

  for (let i = 0; i < playlistEntries.length; i++) {
    const entry = playlistEntries[i];
    const playlistId = parsePlaylistArg(entry.youtube_url);
    const label = `[${(i + 1).toString().padStart(2, '0')}/${playlistEntries.length}] ${truncate(entry.title || entry.channel || playlistId, 60)}`;
    process.stderr.write(`${label} ... `);
    try {
      const videos = await expandPlaylist(playlistId, entry.topic_id);
      expanded.push(...videos);
      okCount++;
      console.error(`${videos.length} videos`);
    } catch (err) {
      failCount++;
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ title: entry.title || playlistId, error: msg });
      console.error(`FAILED: ${msg}`);
    }
  }

  const final = [...singleVideos, ...expanded];
  await writeFile(outFile, JSON.stringify(final, null, 2) + '\n');

  console.error('');
  console.error(`Wrote ${final.length} videos to ${outFile}`);
  console.error(`  - ${singleVideos.length} kept`);
  console.error(`  - ${expanded.length} expanded from ${okCount}/${playlistEntries.length} playlists`);
  if (failCount > 0) {
    console.error(`\n${failCount} playlist(s) failed:`);
    for (const f of failures) {
      console.error(`  - ${truncate(f.title, 60)}: ${f.error}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.all) {
    const outFile = args.out || 'src/data/expanded-videos.json';
    await runAll(outFile);
    return;
  }

  if (args.positional.length === 0) {
    console.error('Usage:');
    console.error('  npm run import-playlist -- <playlistUrlOrId> --topic <topic-id> [--out file.json]');
    console.error('  npm run import-playlist -- --all [--out src/data/expanded-videos.json]');
    process.exit(1);
  }

  const playlistId = parsePlaylistArg(args.positional[0]);
  const topicId = args.topic;
  if (!topicId) {
    console.error('Missing --topic <topic-id>');
    process.exit(1);
  }
  await runSingle(playlistId, topicId, args.out);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
