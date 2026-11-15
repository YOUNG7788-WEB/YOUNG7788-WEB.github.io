# Young 数字花园 · 改版与性能优化

正式公开入口：https://young7788-web.github.io/
独立私人预览：https://young.zzm77088.chatgpt.site/

以 woyun.me 的大字排版、留白和项目预览为参考，使用 Young 自己的资料与封面；保留 19 篇独立文章与旧文章链接。所有文字直接存在 HTML 内；无需 JavaScript 或第三方接口即可阅读。

构建：`python scripts/build_site.py --data content.json --source-root . --output staging`。将 staging/publish-manifest.json 清单文件复制回仓库，并保留原 assets/。不上传 staging/、dist/、original/ 或 .openai/ 到原 GitHub 网站。

首页源：scripts/editorial_home.py、scripts/editorial.css、scripts/editorial.js。正文与分类：content.json。正文样式与交互：scripts/site.css、scripts/site.js。响应式封面生成与体积报告：scripts/optimize_delivery.py。

优化：系统字体、无第三方运行时依赖；非首屏图片懒加载；文章封面按尺寸加载 WebP；省流阅读；弱网/省流模式关闭入场与循环动画；不可见页面暂停循环动画。原始高清封面保持不变。

GitHub Pages 的公开入口不需要 ChatGPT 登录。私人预览仍保持原有访问权限。大陆测速服务在提交目标后要求人机验证，尚未取得本网站大陆节点结果；海外 HTTP 成功不能证明大陆可达。Sites 指定的浏览器 QA 工具未提供，未进行新版浏览器交互实测。
