export type YouTubeKind = 'video' | 'playlist' | 'unknown';

export interface ParsedYouTube {
  kind: YouTubeKind;
  videoId: string | null;
  playlistId: string | null;
}

export function parseYouTubeUrl(url: string | null | undefined): ParsedYouTube {
  if (!url) return { kind: 'unknown', videoId: null, playlistId: null };

  let videoId: string | null = null;
  let playlistId: string | null = null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      videoId = u.pathname.slice(1) || null;
    } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      videoId = u.searchParams.get('v');
      if (!videoId && u.pathname.startsWith('/embed/')) {
        const seg = u.pathname.split('/')[2];
        if (seg && seg !== 'videoseries') videoId = seg;
      }
    }

    playlistId = u.searchParams.get('list');
  } catch {
    return { kind: 'unknown', videoId: null, playlistId: null };
  }

  if (videoId) return { kind: 'video', videoId, playlistId };
  if (playlistId) return { kind: 'playlist', videoId: null, playlistId };
  return { kind: 'unknown', videoId: null, playlistId: null };
}

export function buildEmbedUrl(opts: {
  videoId?: string | null;
  playlistId?: string | null;
  autoplay?: boolean;
}): string | null {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
  });
  if (opts.autoplay) params.set('autoplay', '1');

  if (opts.videoId) {
    if (opts.playlistId) params.set('list', opts.playlistId);
    return `https://www.youtube.com/embed/${opts.videoId}?${params.toString()}`;
  }
  if (opts.playlistId) {
    params.set('list', opts.playlistId);
    return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
  }
  return null;
}

export function getThumbnailUrl(opts: {
  videoId?: string | null;
  thumbnail?: string | null;
}): string | null {
  if (opts.thumbnail) return opts.thumbnail;
  if (opts.videoId) return `https://img.youtube.com/vi/${opts.videoId}/hqdefault.jpg`;
  return null;
}
