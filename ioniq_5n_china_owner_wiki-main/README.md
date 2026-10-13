# ioniq_5n_china_owner_wiki

已使用 VitePress 初始化。

## 开发

```bash
npm run docs:dev
```

## 构建

```bash
npm run docs:build
```

## 本地预览构建结果

```bash
npm run docs:preview
```

## Cloudflare Pages 配置

VitePress 官方针对 `docs/` 目录项目的推荐配置是：

- **Build command**: `npm run docs:build`
- **Output directory**: `docs/.vitepress/dist`
- **Node.js version**: `20` 或更高

另外，Cloudflare Pages 里不要开启 HTML 的 **Auto Minify**，否则可能导致 VitePress/Vue hydration 异常。