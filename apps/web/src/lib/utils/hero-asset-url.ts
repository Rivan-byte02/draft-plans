export function getHeroAssetUrl(assetPath: string | null) {
  if (!assetPath) {
    return null;
  }

  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }

  return `https://cdn.cloudflare.steamstatic.com${assetPath}`;
}
