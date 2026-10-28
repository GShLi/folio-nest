# 部署

本项目输出纯静态文件，不需要 Node.js 常驻服务器或数据库。以下配置已写入仓库；实际域名、托管账户和真实作品需由站点所有者提供。本次代码工作不自动创建外部服务或公开发布。

## 构建前

1. 替换 `public/content/portfolio.json` 中的个人信息和示例项目。
2. 设置 `site.publicUrl` 为实际 HTTPS 根域名，并按真实内容设置站点和项目的 `isDemo`。
3. 如果使用外部 JSON，在托管平台的构建环境设置 `VITE_CONTENT_URL`；没有则留空。
4. 执行 `pnpm check`、`pnpm build` 和 `pnpm preview`。只有构建成功后的 `dist/` 才是部署产物。

构建产物包括首页、`projects/index.html`、每个已发布项目的 `projects/<slug>/index.html`、`404.html`、去除草稿后的 JSON、静态资源、`robots.txt`。配置正式域名后还生成 `sitemap.xml`。示例页面使用 `noindex`，不会加入站点地图。

目前支持域名根路径部署。不要直接上传源代码目录或使用 `file://` 打开 HTML，也不要仅修改 Vite 的 `base` 后部署到子目录；子目录部署还需要同步调整路由和构建路径。

## 静态托管（例如 Netlify）

- 安装命令：`pnpm install --frozen-lockfile`
- 构建命令：`pnpm build`
- 发布目录：`dist`
- Node 版本：22

仓库提供 `public/_redirects` 与 `public/_headers`，构建时自动复制。现有静态页面优先；其他路径回退到首页入口，React 根据 URL 显示对应项目或 404。该行为依据 [Netlify 的 SPA 回退与静态文件优先规则](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/)。其他托管商需配置同等规则，不能假设识别这两个文件。

默认回退返回 HTTP 200，页面内的未知地址会显示 404 并设置 `noindex`；这不等于服务器返回 HTTP 404。如果只在构建时更新内容、希望严格的 HTTP 404，可取消 SPA 回退并将未知路径指向 `404.html`（状态 404）。这样远程 JSON 新增项目后必须重建，才能直接访问新项目 URL。

## 自有服务器：Nginx

将 `dist/` 上传到站点目录，用 `deploy/nginx.conf` 中的规则配置 Nginx，并调整 `root`、`server_name`。HTTPS 证书、域名解析和反向代理由实际服务器环境配置。

关键规则：

```nginx
location / {
    expires -1;
    try_files $uri $uri/ /index.html;
}
```

`/assets/` 使用长缓存，因为构建文件名带内容哈希；HTML 和 JSON 要重新验证缓存，避免发布后仍读取旧内容。Nginx 配置对缺失的图片和 JSON 直接返回 404，避免误把首页当作内容文件。

## Docker

```bash
docker build -t work-show .
docker run --rm -p 8080:80 work-show
```

访问 `http://localhost:8080`。镜像先构建静态站点，再由 Nginx 提供服务。

使用外部 JSON 时：

```bash
docker build --build-arg VITE_CONTENT_URL=https://cdn.example.com/portfolio/portfolio.json -t work-show .
```

这是构建参数，`docker run -e VITE_CONTENT_URL=...` 不会改变已构建的页面。Docker 配置需要在目标环境执行构建与运行验证。

## 外部 JSON 与图片存储

JSON 主机需要返回：

```http
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: https://你的作品站域名
Cache-Control: no-cache
```

完全公开的数据也可按需要允许 `*` 来源。图片应允许作品站直接显示；小程序码和截图 URL 应长期稳定。浏览器按普通图片方式加载图片，不需要 JSON 接口的认证配置。

构建时读取的内容被嵌入 HTML，以提供无 JavaScript 阅读和失败兜底；浏览器加载后重新请求 JSON。远端更新不会修改已有 HTML，也不会推送到已打开的页面。下架、删除、分享摘要变更和 SEO 更新均应重新构建发布，必要时清理 CDN 缓存。

## 验证与回滚

部署后打开首页和一个项目的独立地址，直接刷新，检查明暗切换、图片、外链和移动端布局；确认实际域名的 HTML 标题、canonical、`robots.txt` 与 `sitemap.xml`。外部 JSON 还需在实际域名验证 CORS。

保留上一个成功构建版本与对应 JSON，可以用托管平台回滚或重新上传恢复。不要在仅更新 JSON 的同时删除仍被旧版本引用的图片。
