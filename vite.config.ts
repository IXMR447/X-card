import { defineConfig } from 'vite';
import { resolve } from 'path';

function normalizeBasePath(value: string): string {
  if (value === '/' || value === './') return value;
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

function getBasePath(): string {
  if (process.env.VITE_BASE_PATH) {
    return normalizeBasePath(process.env.VITE_BASE_PATH);
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY?.split('/') ?? [];
  if (owner && repo) {
    const isUserPagesRepo = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
    return isUserPagesRepo ? '/' : `/${repo}/`;
  }

  return '/X-card/';
}

export default defineConfig({
  base: getBasePath(),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
