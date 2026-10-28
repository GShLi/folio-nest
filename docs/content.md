# 内容维护

所有数据写入 `public/content/portfolio.json`。根对象只有 `$schema`、`schemaVersion`、`site`、`categories`、`projects`，不接受未定义字段。

## 站点信息

| 字段                         | 含义                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| `schemaVersion`              | 固定为数字 `1`                                                       |
| `site.name` / `monogram`     | 导航中的名字和简写                                                   |
| `site.title` / `description` | 首页标题和搜索摘要                                                   |
| `site.publicUrl`             | 可选正式域名根地址；填写后构建生成 canonical、站点地图和绝对图片地址 |
| `site.tagline` / `footer`    | 顶部短句与页脚署名                                                   |
| `site.isDemo`                | 为 `true` 显示示例声明，所有页面不参与搜索索引                       |
| `site.hero.eyebrow`          | 首页小标题                                                           |
| `site.hero.heading`          | 一至两段标题，按数组分行，末尾由界面补句号                           |
| `site.hero.description`      | 首页介绍，使用 `\n` 换行                                             |
| `categories`                 | `{ "id": "web", "label": "Web 应用" }` 数组，分类 ID 唯一            |
| `projects`                   | 项目数组，允许空数组                                                 |

## 项目字段

以 [完整模板](../content/project.template.json) 为准；可选字段不要写 `null`，不需要时直接省略。

| 字段                | 是否必填 | 说明                                                       |
| ------------------- | -------- | ---------------------------------------------------------- |
| `slug`              | 是       | 唯一永久链接标识，仅小写英文、数字和连字符；发布后尽量不改 |
| `name` / `subtitle` | 是       | 项目名和一句话说明                                         |
| `category`          | 是       | 引用 `categories` 中的一个 ID                              |
| `description`       | 是       | 卡片与搜索摘要，最多 240 字符                              |
| `summary`           | 是       | 详情页开头的项目概述                                       |
| `year`              | 是       | 字符串年份，例如 `"2026"`                                  |
| `status`            | 是       | `draft` 草稿、`published` 发布、`archived` 归档            |
| `sortOrder`         | 是       | 0–100000 整数，越小越靠前；相同时按 slug 排序              |
| `featured`          | 是       | 首页主推，全站最多一个已发布项目设为 `true`                |
| `isDemo`            | 是       | 示例内容标识；真实案例请设为 `false`                       |
| `cover`             | 是       | `{ "url": "https://...", "alt": "图片描述" }`              |
| `color`             | 是       | 图片加载背景，六位十六进制颜色，如 `"#e5e8df"`             |
| `tags`              | 是       | 技术栈字符串数组，至少一项                                 |
| `role` / `duration` | 是       | 负责方向与实际项目周期，自由文本                           |
| `sections`          | 是       | 按顺序展示的正文段落，至少一个章节                         |
| `gallery`           | 否       | 截图数组，每项格式同 cover，支持点击放大                   |
| `links.demo`        | 否       | HTTPS 在线体验链接                                         |
| `links.source`      | 否       | HTTPS 源码链接                                             |
| `miniProgramCode`   | 否       | 小程序码图片，格式同 cover，支持放大                       |

每张图片支持公开 HTTPS 链接或 `/images/...` 站内路径；不支持 base64、协议相对地址、HTTP、含用户名密码的 URL。站内图片的路径必须在 `public/` 内，构建会检查已发布项目引用的文件是否存在。远程图片不会在构建时逐张下载校验；请在预览时确认加载和扫码可用。

## 案例正文

章节使用纯文本，不执行 HTML 或 Markdown，避免外部内容注入网页。示例：

```json
{
  "id": "implementation",
  "title": "解决了哪些技术问题",
  "paragraphs": ["描述背景和约束，说明自己负责的部分。", "描述具体方案、取舍和可验证的结果。"],
  "features": [{ "title": "支付状态一致性", "text": "说明幂等处理与失败恢复是如何实现的。" }],
  "steps": ["用户操作", "接口校验", "状态更新"],
  "disclosure": {
    "title": "查看方案取舍",
    "text": "这里放可展开的补充说明。"
  }
}
```

`id`、`title`、`paragraphs` 必填；`features`、`steps`、`disclosure` 可选。章节 ID 在单个项目内唯一。对标题、段落、项目数量等限制，以生成的 Schema 为准。不要把示例中的技术结论或成果直接当成自己的经历。

## 管理命令

```bash
pnpm content:new coffee-mini-app
pnpm content:validate
pnpm content:export
pnpm content:export --out .output/cdn
pnpm content:validate --file ./downloaded-portfolio.json
pnpm content:new another-project --file ./my-portfolio.json
```

新建命令拒绝重复 slug，并先校验再原子写入文件。修改 JSON 有格式或关联错误时，校验会显示字段路径，例如 `projects.0.category`。命令只修改本地文件，不会上传到 CDN，也不会自动部署。

外部内容可先下载到本地校验，然后导出并上传；不要直接上传包含草稿的源 JSON。建议用 Git 管理源文件，并由版本记录恢复误改内容。上线后将草稿改为发布、下架项目或修改 slug 都应重新构建，以同步已有静态页面与站点地图。
