interface ResourceRef {
  key: string;
  contentType: 'video' | 'richtlijn' | 'artikel' | 'boek' | 'website';
  title?: string;
  label?: string;
}

export interface ManifestMap {
  [key: string]: any;
}

export function extractResourceRefsFromText(text: string): ResourceRef[] {
  const refs: ResourceRef[] = [];
  
  if (!text) return refs;
  
  // Zoek naar URL patronen
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlPattern) || [];
  
  urls.forEach(url => {
    const key = `url:${url}`;
    let contentType: 'video' | 'richtlijn' | 'artikel' | 'boek' | 'website' = 'website';
    
    // Bepaal content type op basis van URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      contentType = 'video';
    } else if (url.includes('richtlijn') || url.includes('guideline')) {
      contentType = 'richtlijn';
    } else if (url.includes('artikel') || url.includes('article')) {
      contentType = 'artikel';
    } else if (url.includes('boek') || url.includes('book')) {
      contentType = 'boek';
    }
    
    refs.push({
      key,
      contentType,
      title: url,
      label: url
    });
  });
  
  // Zoek naar andere resource referenties (kan uitgebreid worden)
  const resourcePattern = /\[([^\]]+)\]/g;
  let match;
  
  while ((match = resourcePattern.exec(text)) !== null) {
    const resourceText = match[1];
    const key = `resource:${resourceText}`;
    
    refs.push({
      key,
      contentType: 'artikel', // default
      title: resourceText,
      label: resourceText
    });
  }
  
  return refs;
}

interface ResourceGroup {
  id: string;
  label: string;
}

export function getResourceGroup(resource: ResourceRef): ResourceGroup {
  // Bepaal groep op basis van content type en key
  if (resource.key.startsWith('url:')) {
    const url = resource.key.slice(4);
    
    // YouTube videos
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return {
        id: 'channel:youtube',
        label: 'YouTube Videos'
      };
    }
    
    // Domain-based grouping voor websites
    try {
      const domain = new URL(url).hostname;
      return {
        id: `domain:${domain}`,
        label: domain
      };
    } catch {
      return {
        id: 'domain:unknown',
        label: 'Onbekende Website'
      };
    }
  }
  
  // Boek referenties
  if (resource.contentType === 'boek') {
    return {
      id: 'boek:general',
      label: 'Boeken'
    };
  }
  
  // Richtlijnen
  if (resource.contentType === 'richtlijn') {
    return {
      id: 'richtlijn:general',
      label: 'Richtlijnen'
    };
  }
  
  // Artikelen
  if (resource.contentType === 'artikel') {
    return {
      id: 'artikel:general',
      label: 'Artikelen'
    };
  }
  
  // Default
  return {
    id: 'other:general',
    label: 'Overige Bronnen'
  };
}
