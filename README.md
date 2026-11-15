# Young 的数字花园

使用免费的 GitHub Pages 发布静态首页和 19 篇独立文章。首页可直接阅读，不依赖加载全站 JSON；`lite.html` 是不加载图片的省流目录。

## 正式网站

新版已替换原仓库的正式首页，网址保持为 https://young7788-web.github.io/ 。`/` 与 `/index.html` 均使用新版；`/lite.html` 是省流目录；完整文章位于 `/posts/`。

旧版动态渲染代码和样式已退役。`app.js`、`article.js` 只为缓存的旧页面跳转到新版，不再负责渲染或请求全站内容。`article.html?id=…` 同样保留为旧文章链接的兼容入口。新的实现统一维护在 `scripts/`，不要恢复旧版样式文件。

## 更新内容

正文与栏目资料在 `content.json`。封面原图由 `categoryImages` 和各文章的 `image` 指向。已有 `preview` 字段为兼容旧版本保留，当前首页不会下载这个 JSON。

安装 Python 与 Pillow 后，在仓库根目录运行：

```powershell
python scripts/build_site.py --data content.json --source-root . --output site-build
```

检查 `site-build` 中的页面，然后把 `publish-manifest.json` 列出的文件复制回仓库并提交。保留原来的高清封面文件；同时提交 `index.html`、`lite.html`、`article.html`、`posts/`、新增缩略图和 `search-index.json` 等生成结果。

`scripts/site.css` 和 `scripts/site.js` 会内联到页面中。旧的 `article.html?id=…` 网址会转到对应静态长文。`performance-budget.json` 记录文件体积，不代表大陆网络测速结果。

## 极简数字花园与加载优化

首页采用大字排版，保留 19 篇文章和原始封面。首页源位于 `scripts/editorial_home.py`、`scripts/editorial.css`、`scripts/editorial.js`；正文样式和交互位于 `scripts/site.css`、`scripts/site.js`。`scripts/build_site.py` 先调用静态正文生成器，再生成首页和响应式图片。

运行同一构建命令即可生成完整站点。生成产物清单包括新增的 `assets/optimized/`，发布时需一并复制。原始高清封面保持不变；浏览器按屏幕尺寸选择 480/最大 960 像素的 WebP 封面。首页不依赖第三方字体、脚本 CDN、登录或外部接口。省流入口为 `/lite.html`。

大陆可达性需要大陆运营商节点实测；本仓库的性能体积统计不能当成大陆测速结果。

## 安全发布

生成器自动为全部页面添加匹配脚本内容的 CSP 哈希与 no-referrer 策略。构建后运行 `python scripts/check_site_security.py .`。此检查只使用 Python 标准库。

根目录的 `_config.yml` 会在 GitHub Pages 构建时排除 `content.json`、源码脚本和文档。不要恢复根目录 `.nojekyll`；它会使这些排除规则失效。仓库本身仍然公开，私人草稿、密码和密钥不能放入本仓库，详见 `SECURITY.md`。
