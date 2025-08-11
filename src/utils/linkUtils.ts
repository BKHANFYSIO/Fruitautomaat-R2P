export type MediaKind = 'youtube' | 'vimeo' | 'image' | 'link';

export const URL_REGEX = /(https?:\/\/[^\s)]+)(?=[\s)|]|$)/gi;

export function extractUrlsFromText(text: string): string[] {
  const urls: string[] = [];
  (text || '').replace(URL_REGEX, (m) => {
    urls.push(m);
    return m;
  });
  return Array.from(new Set(urls));
}

export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = '';
    u.hostname = u.hostname.toLowerCase();
    const params = u.searchParams;
    const toDelete: string[] = [];
    params.forEach((_v, k) => {
      if (/^(utm_|gclid|fbclid|mc_eid|mc_cid)/i.test(k)) {
        toDelete.push(k);
      }
    });
    toDelete.forEach((k) => params.delete(k));
    u.search = params.toString();
    return u.toString();
  } catch {
    return raw;
  }
}

export function getYouTubeId(raw: string): string | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      return u.pathname.split('/').filter(Boolean)[0] || null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname.startsWith('/watch')) return u.searchParams.get('v');
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/').filter(Boolean)[1] || null;
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/').filter(Boolean)[1] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function detectMediaKind(raw: string): MediaKind {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');
    if (getYouTubeId(raw)) return 'youtube';
    if (host === 'vimeo.com' || host === 'player.vimeo.com') return 'vimeo';
    if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(u.pathname)) return 'image';
    return 'link';
  } catch {
    return 'link';
  }
}

export function getSiteName(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}






