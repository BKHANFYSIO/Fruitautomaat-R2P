import React, { useMemo } from 'react';
import './AntwoordContent.css';
import { useEffect, useState } from 'react';
import { getSiteName } from '../utils/linkUtils';

interface AntwoordContentProps {
  text: string;
}

type EmbedItem =
  | { kind: 'youtube'; id: string; url: string }
  | { kind: 'vimeo'; id: string; url: string }
  | { kind: 'image'; url: string };

const urlRegex = /(https?:\/\/[^\s)]+)(?=[\s)|]|$)/gi;

function extractEmbedsFromUrls(urls: string[]): EmbedItem[] {
  const embeds: EmbedItem[] = [];
  for (const rawUrl of urls) {
    try {
      const url = new URL(rawUrl);
      const hostname = url.hostname.replace(/^www\./, '');
      // YouTube watch
      if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtu.be' || hostname === 'youtube-nocookie.com') {
        let videoId: string | null = null;
        if (hostname === 'youtu.be') {
          videoId = url.pathname.split('/').filter(Boolean)[0] || null;
        } else if (url.pathname.startsWith('/watch')) {
          videoId = url.searchParams.get('v');
        } else if (url.pathname.startsWith('/shorts/')) {
          videoId = url.pathname.split('/').filter(Boolean)[1] || null;
        } else if (url.pathname.startsWith('/embed/')) {
          videoId = url.pathname.split('/').filter(Boolean)[1] || null;
        }
        if (videoId) {
          embeds.push({ kind: 'youtube', id: videoId, url: rawUrl });
          continue;
        }
      }
      // Vimeo
      if (hostname === 'vimeo.com' || hostname === 'player.vimeo.com') {
        const parts = url.pathname.split('/').filter(Boolean);
        const id = parts.find((p) => /^(\d+)$/.test(p));
        if (id) {
          embeds.push({ kind: 'vimeo', id, url: rawUrl });
          continue;
        }
      }
      // Image by extension
      if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url.pathname)) {
        embeds.push({ kind: 'image', url: rawUrl });
        continue;
      }
    } catch {
      // Ignore invalid URL
    }
  }
  return embeds;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

type ManifestEntry = {
  originalUrl: string;
  normalizedUrl?: string;
  localPath?: string;
  contentHash?: string;
  etag?: string;
  lastModified?: string;
  lastChecked?: string;
  status?: 'ok' | 'error' | 'stale';
  meta?: { title?: string; author?: string; site?: string; kind?: 'image' | 'youtube' | 'vimeo' };
};

type ManifestMap = Record<string, ManifestEntry>;

function renderApa(entry: ManifestEntry): string | null {
  const url = entry.originalUrl;
  const site = entry.meta?.site || getSiteName(url) || 'Onbekende bron';
  const title = entry.meta?.title || 'Zonder titel';
  const author = entry.meta?.author || site;
  const vandaag = new Date();
  const datum = `${vandaag.getDate().toString().padStart(2, '0')}-${(vandaag.getMonth() + 1).toString().padStart(2, '0')}-${vandaag.getFullYear()}`;
  const typeLabel = entry.meta?.kind === 'youtube' || entry.meta?.kind === 'vimeo' ? 'Video' : 'Afbeelding';
  return `${author}. (z.d.). ${title} [${typeLabel}]. Geraadpleegd op ${datum}, van ${url}`;
}

export const AntwoordContent: React.FC<AntwoordContentProps> = ({ text }) => {
  const [manifestMap, setManifestMap] = useState<ManifestMap>({});
  useEffect(() => {
    // Manifest lazy laden zodat Vite build geen JSON buiten src hoeft te importeren
    fetch('/answer-media/manifest.json')
      .then((r) => r.json())
      .then((data) => setManifestMap(data || {}))
      .catch(() => setManifestMap({}));
  }, []);
  const { paragraphsWithLinks, embeds } = useMemo(() => {
    const paragraphs = (text || '').split(/\n+/);
    const allUrls: string[] = [];
    const paragraphsWithLinks = paragraphs.map((para) => {
      const parts: Array<string | { url: string }> = [];
      let lastIndex = 0;
      para.replace(urlRegex, (match, _p1, offset: number) => {
        if (offset > lastIndex) {
          parts.push(para.slice(lastIndex, offset));
        }
        parts.push({ url: match });
        allUrls.push(match);
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < para.length) {
        parts.push(para.slice(lastIndex));
      }
      return parts;
    });
    const embeds = extractEmbedsFromUrls(unique(allUrls));
    return { paragraphsWithLinks, embeds };
  }, [text]);

  if (!text || text.trim() === '') {
    return <div className="antwoord-richtext geen-antwoord">Geen antwoordsleutel opgegeven.</div>;
  }

  return (
    <div className="antwoord-richtext">
      {paragraphsWithLinks.map((parts, idx) => (
        <p key={idx}>
          {parts.map((part, i) => {
            if (typeof part === 'string') {
              return <React.Fragment key={i}>{part}</React.Fragment>;
            }
            const href = part.url;
            const entry: ManifestEntry | undefined = manifestMap[href];
            const label = entry?.localPath ? `${href} (lokaal in cache)` : href;
            return <a key={i} href={href} target="_blank" rel="noopener noreferrer">{label}</a>;
          })}
        </p>
      ))}

      {embeds.length > 0 && (
        <div className="media-embeds">
          {embeds.map((item, i) => {
            if (item.kind === 'image') {
              const entry: ManifestEntry | undefined = manifestMap[item.url];
              const src = entry?.localPath || item.url;
              return (
                <div className="media-image" key={`img-${i}`}>
                  <img src={src} alt="Ingezonden afbeelding" loading="lazy" />
                  <div className="media-link">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">Open originele link</a>
                    {entry && (
                      <div className="apa-citation">{renderApa(entry)}</div>
                    )}
                  </div>
                </div>
              );
            }
            if (item.kind === 'youtube') {
              const embedSrc = `https://www.youtube.com/embed/${item.id}?rel=0&modestbranding=1`;
              const entry: ManifestEntry | undefined = manifestMap[item.url];
              return (
                <div className="media-video" key={`yt-${i}`}>
                  <iframe
                    src={embedSrc}
                    title="YouTube video"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                  />
                  <div className="media-link">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">Open video</a>
                    {entry && (
                      <div className="apa-citation">{renderApa(entry)}</div>
                    )}
                  </div>
                </div>
              );
            }
            if (item.kind === 'vimeo') {
              const embedSrc = `https://player.vimeo.com/video/${item.id}`;
              const entry: ManifestEntry | undefined = manifestMap[item.url];
              return (
                <div className="media-video" key={`vimeo-${i}`}>
                  <iframe
                    src={embedSrc}
                    title="Vimeo video"
                    loading="lazy"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                  />
                  <div className="media-link">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">Open video</a>
                    {entry && (
                      <div className="apa-citation">{renderApa(entry)}</div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default AntwoordContent;


