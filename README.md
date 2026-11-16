# Young 的数字花园 · 工程师手记

正式公开站：https://young7788-web.github.io/  
带安全响应头的私人版本：https://young.zzm77088.chatgpt.site/

记录电气工程学习、AI 与网站实践、服务器折腾及生活。保留 19 篇独立文章、原有封面和旧文章链接。网站使用静态 HTML、系统字体与原生 JavaScript，不依赖外部字体或脚本 CDN。

## 设计与内容

本版根据司徒K《什么是好的个人网站，30个优质网站精选》重新组织：个人介绍、项目过程、可检索的手记、可操作的小实验、近期关注和联系方式。视觉采用纸张色、墨绿、陶土色和自绘工作台插画。文章页提供同类阅读入口；RSS 位于 `/feed.xml`。

文章与分类源在 `content.json`，仅放已公开内容。首页源为 `scripts/editorial_home.py`、`scripts/editorial.css`、`scripts/editorial.js`；正文样式与交互为 `scripts/site.css`、`scripts/site.js`。

## 构建与验证

使用 Python 与 Pillow：

```sh
python scripts/build_site.py --data content.json --source-root . --output staging
```

将 `staging/publish-manifest.json` 中列出的文件复制到仓库根目录，保留原始高清资产。`index.html`、`lite.html`、`posts/`、`feed.xml` 等均为生成文件，不能只改 JSON 而不重新构建。

```sh
python scripts/check_site_security.py .
python scripts/build_secure_worker.py
node scripts/test_secure_worker.mjs
node scripts/test_secure_runtime.mjs
```

Worker 构建把公开运行时文件打包到 `dist/server/index.js`。旧高清图仅从固定原站按白名单加载，不转发访客 Cookie 或认证头。

## 发布边界

根目录 `_config.yml` 在 GitHub Pages 构建中排除作者 JSON、源码和文档；不要恢复根目录 `.nojekyll`，它会使排除规则失效。仓库本身仍公开，私人草稿、密码和密钥不能进入仓库或其历史。

所有页面都有自动生成的脚本 CSP 哈希与 no-referrer 策略。Worker 版本额外提供真实防嵌入响应头及私人缓存保护。两个部署的访问范围各自保留，见 `SECURITY.md`。

HTML 和图片体积记录在 `performance-budget.json`；这些统计及境外验证不代表大陆网络可达性。
