# Young 的手记 · 在工程与好奇心之间

正式公开站：https://young7788-web.github.io/  
带安全响应头的私人版本：https://young.zzm77088.chatgpt.site/

记录电气工程学习、AI 与网站实践、服务器折腾及生活。保留 19 篇独立文章、原有封面和旧文章链接。网站使用静态 HTML、系统字体与原生 JavaScript，不依赖外部字体或脚本 CDN。

## 设计与内容

本版根据司徒K《什么是好的个人网站，30个优质网站精选》重新组织：个人介绍、项目过程、可检索的手记、可操作的小实验、近期关注和联系方式。视觉采用纸张色、墨绿、陶土色和自绘工作台插画。文章页提供同类阅读入口；RSS 位于 `/feed.xml`。

文章与分类源在 `content.json`，仅放已公开内容。首页源为 `scripts/editorial_home.py`、`scripts/editorial.css`、`scripts/editorial.js`；正文样式与交互为 `scripts/site.css`、`scripts/site.js`。

## 构建与验证

使用 Python 3.10+ 与 Pillow（当前构建环境为 Pillow 13.0.0）：

```sh
python scripts/sync_site.py
```

此命令在干净的临时目录中构建、按清单同步到根目录、运行安全检查，并重新生成 `dist/server/index.js`。原始高清资产保留。`index.html`、`lite.html`、`posts/`、`feed.xml` 等均为生成文件，不能只改 JSON 而不重新构建。

首页只由 `editorial_home.render` 生成；`base_build.py` 只生成文章、纯文字目录、兼容链接和封面，不再保留旧首页模板。文章脚本只处理阅读交互，首页搜索与筛选集中在 `editorial.js`。

```sh
python scripts/sync_site.py --check
node scripts/test_secure_worker.mjs
node scripts/test_secure_runtime.mjs
```

`--check` 重新构建并比对生成文件与 Worker，发现源码与发布文件不同步时失败，不修改网站文件。图像编码库的版本可能影响生成的 WebP 字节；在同一构建环境中更新并验证。

GitHub Pages 仓库提交源码、生成页面、安全工作流与 `worker/runtime.mjs`，不提交 Sites 专用的 `.openai/` 和 `dist/`。Sites 源码仓库额外保留其项目清单和 Worker 部署输出。两端使用相同的页面与生成器。

旧高清图仅从固定原站按白名单加载，不转发访客 Cookie 或认证头。旧 `article.html?id=…`、`app.js`、`article.js` 仅保留到新版页面的兼容跳转。

## 发布边界

根目录 `_config.yml` 在 GitHub Pages 构建中排除作者 JSON、源码和文档；不要恢复根目录 `.nojekyll`，它会使排除规则失效。仓库本身仍公开，私人草稿、密码和密钥不能进入仓库或其历史。

所有页面都有自动生成的脚本 CSP 哈希与 no-referrer 策略。Worker 版本额外提供真实防嵌入响应头及私人缓存保护。两个部署的访问范围各自保留，见 `SECURITY.md`。

HTML 和图片体积记录在 `performance-budget.json`；这些统计及境外验证不代表大陆网络可达性。
