// Client-side YouTube Data API v3 helpers. Mirrors what
// scripts/import-playlist.ts does, but runs from the admin panel.

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

export const isYouTubeApiConfigured = Boolean(API_KEY);

interface PlaylistSnippet {
  title: string;
  channelTitle?: string;
  thumbnails?: {
    high?: { url: string };
    medium?: { url: string };
    default?: { url: string };
  };
}

interface PlaylistListResponse {
  items?: Array<{ id: string; snippet: PlaylistSnippet; contentDetails?: { itemCount?: number } }>;
  error?: { message: string };
}

interface PlaylistItemSnippet {
  title: string;
  videoOwnerChannelTitle?: string;
  channelTitle?: string;
  thumbnails?: {
    high?: { url: string };
    medium?: { url: string };
    default?: { url: string };
  };
  resourceId: { videoId: string };
}

interface PlaylistItemsResponse {
  items?: Array<{ snippet: PlaylistItemSnippet }>;
  nextPageToken?: string;
  error?: { message: string };
}

interface VideoDetails {
  id: string;
  contentDetails: { duration: string };
}

interface VideosResponse {
  items?: VideoDetails[];
  error?: { message: string };
}

export interface FetchedPlaylist {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

export interface FetchedVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
}

export interface FetchedPlaylistData {
  playlist: FetchedPlaylist;
  videos: FetchedVideo[];
}

export function extractPlaylistId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const list = u.searchParams.get('list');
    if (list) return list;
  } catch {}
  // Bare playlist ID (PL... / UU... / FL... / RD...)
  if (/^[A-Z]{2}[\w-]{10,}$/.test(raw)) return raw;
  return null;
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

async function ytFetch<T>(url: URL): Promise<T> {
  const res = await fetch(url.toString());
  const data = (await res.json()) as T & { error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  if (!res.ok) throw new Error(`YouTube API error (${res.status})`);
  return data;
}

async function fetchPlaylistMeta(playlistId: string): Promise<FetchedPlaylist | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/playlists');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('id', playlistId);
  url.searchParams.set('key', API_KEY);

  const data = await ytFetch<PlaylistListResponse>(url);
  const item = data.items?.[0];
  if (!item) return null;
  const thumb =
    item.snippet.thumbnails?.high?.url ||
    item.snippet.thumbnails?.medium?.url ||
    item.snippet.thumbnails?.default?.url ||
    '';
  return {
    id: item.id,
    title: item.snippet.title,
    channel: item.snippet.channelTitle || '',
    thumbnail: thumb,
  };
}

async function fetchPlaylistItems(playlistId: string): Promise<PlaylistItemSnippet[]> {
  const items: PlaylistItemSnippet[] = [];
  let pageToken = '';
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('playlistId', playlistId);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', API_KEY);

    const data = await ytFetch<PlaylistItemsResponse>(url);
    for (const it of data.items || []) items.push(it.snippet);
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
    url.searchParams.set('key', API_KEY);

    const data = await ytFetch<VideosResponse>(url);
    for (const item of data.items || []) {
      out[item.id] = isoDurationToHuman(item.contentDetails.duration);
    }
  }
  return out;
}

export async function fetchPlaylistData(playlistId: string): Promise<FetchedPlaylistData> {
  if (!API_KEY) {
    throw new Error('VITE_YOUTUBE_API_KEY is not set');
  }

  const meta = await fetchPlaylistMeta(playlistId);
  if (!meta) throw new Error('Playlist not found or is private');

  const items = await fetchPlaylistItems(playlistId);
  const valid = items.filter((it) => it.resourceId?.videoId);
  if (valid.length === 0) throw new Error('Playlist has no public videos');

  const videoIds = valid.map((it) => it.resourceId.videoId);
  const durations = await fetchVideoDurations(videoIds);

  const videos: FetchedVideo[] = valid.map((it) => {
    const id = it.resourceId.videoId;
    const thumb =
      it.thumbnails?.high?.url ||
      it.thumbnails?.medium?.url ||
      it.thumbnails?.default?.url ||
      `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    return {
      videoId: id,
      title: it.title,
      channel: it.videoOwnerChannelTitle || it.channelTitle || meta.channel,
      thumbnail: thumb,
      duration: durations[id] || '',
    };
  });

  return { playlist: meta, videos };
}
