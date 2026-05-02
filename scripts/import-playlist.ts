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

const API_KEY = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error('Missing VITE_YOUTUBE_API_KEY in .env.local');
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
  playlist_id?: string;
}

interface OutputPlaylist {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  video_count: number;
  topic_id: string;
}

interface PlaylistSnippet {
  id: string;
  snippet: {
    title: string;
    channelTitle?: string;
    thumbnails?: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
  contentDetails?: { itemCount?: number };
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
    playlist_id: playlistId,
  };
}

async function fetchPlaylistsMeta(playlistIds: string[]): Promise<Map<string, PlaylistSnippet>> {
  const out = new Map<string, PlaylistSnippet>();
  for (let i = 0; i < playlistIds.length; i += 50) {
    const chunk = playlistIds.slice(i, i + 50);
    const url = new URL('https://www.googleapis.com/youtube/v3/playlists');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', chunk.join(','));
    url.searchParams.set('key', API_KEY!);

    const res = await fetch(url.toString());
    const data = (await res.json()) as { items?: PlaylistSnippet[]; error?: { message: string } };
    if (data.error) throw new Error(data.error.message);
    for (const p of data.items || []) {
      out.set(p.id, p);
    }
  }
  return out;
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
  const existingPlaylists = ((mod.libraryData as { playlists?: OutputPlaylist[] })?.playlists ?? []) as OutputPlaylist[];

  // Single videos = those without a derived playlist origin (no playlist_id and
  // no expansion-shaped id).
  const isExpanded = (v: OutputVideo) => Boolean(v.playlist_id) || /^vid-PL[\w-]+-\d+$/.test(v.id);
  const singleVideos = existing.filter((v) => v.youtube_id && v.youtube_id.length > 0 && !isExpanded(v));

  // Playlist source: prefer existing playlists registry; fall back to legacy
  // placeholder entries (youtube_id empty + list= in URL).
  const placeholderEntries = existing.filter(
    (v) => (!v.youtube_id || v.youtube_id.length === 0) && v.youtube_url?.includes('list=')
  );

  type Source = { playlistId: string; topicId: string };
  let sources: Source[];
  if (existingPlaylists.length > 0) {
    sources = existingPlaylists.map((p) => ({ playlistId: p.id, topicId: p.topic_id }));
  } else if (placeholderEntries.length > 0) {
    sources = placeholderEntries.map((e) => ({ playlistId: parsePlaylistArg(e.youtube_url), topicId: e.topic_id }));
  } else {
    // Derive from already-expanded video IDs (vid-PL...-N) so we can re-build
    // the playlists[] registry without losing data.
    const seen = new Map<string, string>();
    for (const v of existing) {
      const m = v.id.match(/^vid-(PL[\w-]+)-\d+$/);
      if (m) {
        const pid = m[1];
        if (!seen.has(pid)) seen.set(pid, v.topic_id);
      }
    }
    sources = Array.from(seen.entries()).map(([playlistId, topicId]) => ({ playlistId, topicId }));
  }

  console.error(`Found ${existing.length} total video entries`);
  console.error(`  - ${singleVideos.length} single videos (kept as-is)`);
  console.error(`  - ${sources.length} playlists to (re)expand\n`);

  if (sources.length === 0) {
    console.error('Nothing to expand.');
    return;
  }

  // Fetch playlist metadata in batches first so we can label the progress
  // lines with real titles and emit a clean playlists[] array.
  console.error('Fetching playlist metadata...');
  const meta = await fetchPlaylistsMeta(sources.map((s) => s.playlistId));
  console.error(`  -> ${meta.size}/${sources.length} resolved\n`);

  const expanded: OutputVideo[] = [];
  const playlists: OutputPlaylist[] = [];
  let okCount = 0;
  let failCount = 0;
  const failures: { title: string; error: string }[] = [];

  for (let i = 0; i < sources.length; i++) {
    const { playlistId, topicId } = sources[i];
    const m = meta.get(playlistId);
    const title = m?.snippet.title || playlistId;
    const label = `[${(i + 1).toString().padStart(2, '0')}/${sources.length}] ${truncate(title, 56)}`;
    process.stderr.write(`${label} ... `);
    try {
      const videos = await expandPlaylist(playlistId, topicId);
      expanded.push(...videos);
      const thumb =
        m?.snippet.thumbnails?.high?.url ||
        m?.snippet.thumbnails?.medium?.url ||
        videos[0]?.thumbnail ||
        '';
      playlists.push({
        id: playlistId,
        title,
        channel: m?.snippet.channelTitle || videos[0]?.channel || '',
        thumbnail: thumb,
        video_count: videos.length,
        topic_id: topicId,
      });
      okCount++;
      console.error(`${videos.length} videos`);
    } catch (err) {
      failCount++;
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ title, error: msg });
      console.error(`FAILED: ${msg}`);
    }
  }

  const finalVideos = [...singleVideos, ...expanded];
  await writeFile(outFile, JSON.stringify({ videos: finalVideos, playlists }, null, 2) + '\n');

  console.error('');
  console.error(`Wrote ${finalVideos.length} videos and ${playlists.length} playlists to ${outFile}`);
  console.error(`  - ${singleVideos.length} kept`);
  console.error(`  - ${expanded.length} expanded from ${okCount}/${sources.length} playlists`);
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
