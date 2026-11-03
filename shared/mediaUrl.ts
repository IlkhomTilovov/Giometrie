/**
 * Uploads can contain absolute development URLs in older CMS records. Resolve
 * only our uploads on a loopback host; third-party media must keep its origin.
 * With no separate API base, uploads are served by the site's /uploads proxy.
 */
export function resolveUploadedMediaUrl(value: string, apiBaseUrl = ''): string {
  let uploadPath: string;

  if (value.startsWith('/uploads/')) {
    uploadPath = value;
  } else {
    let url: URL;
    try {
      url = new URL(value.startsWith('//') ? `https:${value}` : value);
    } catch {
      return value;
    }

    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
    if (
      !isLoopback ||
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username || url.password ||
      !url.pathname.startsWith('/uploads/')
    ) {
      return value;
    }

    uploadPath = `${url.pathname}${url.search}${url.hash}`;
  }

  return `${apiBaseUrl.replace(/\/+$/, '')}${uploadPath}`;
}
