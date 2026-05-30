/**
 * 解析静态资源 URL，兼容 GitHub Pages 子路径（import.meta.env.BASE_URL）
 * @param path 相对 public/ 的路径，如 `assets/cards/strike.png`；或 http(s)/data URL
 */
export function resolveAssetUrl(path: string): string {
  if (/^(https?:|data:)/.test(path)) {
    return path;
  }
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}
