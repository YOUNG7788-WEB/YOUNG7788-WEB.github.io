# Young 的数字花园

使用免费的 GitHub Pages 发布静态首页和 19 篇独立文章。首页可直接阅读，不依赖加载全站 JSON；`lite.html` 是不加载图片的省流目录。

## 更新内容

正文与栏目资料在 `content.json`。封面原图由 `categoryImages` 和各文章的 `image` 指向。已有 `preview` 字段为兼容旧版本保留，当前首页不会下载这个 JSON。

安装 Python 与 Pillow 后，在仓库根目录运行：

```powershell
python scripts/build_site.py --data content.json --source-root . --output site-build
```

检查 `site-build` 中的页面，然后把 `publish-manifest.json` 列出的文件复制回仓库并提交。保留原来的高清封面文件；同时提交 `index.html`、`lite.html`、`article.html`、`posts/`、新增缩略图和 `search-index.json` 等生成结果。

`scripts/site.css` 和 `scripts/site.js` 会内联到页面中。旧的 `article.html?id=…` 网址会转到对应静态长文。`performance-budget.json` 记录文件体积，不代表大陆网络测速结果。

