# Publishing this website

The public website is generated static HTML on free GitHub Pages. Keep hosting free and preserve all existing articles and distinct cover images.

- `content.json` is the authoring source. `index.html`, `lite.html`, and `posts/*.html` are generated. Updating only JSON does not update the published pages.
- Run `python scripts/sync_site.py` after editing source content. It uses Pillow and the full cover files referenced by `categoryImages` and each item's `image`, builds in a clean temporary directory, copies all manifest outputs, validates security, and refreshes the Worker. Preserve existing full-resolution assets. Commit generated pages with the source change.
- Run `python scripts/sync_site.py --check` to detect stale generated pages or Worker output without updating files. Run the existing Worker and runtime tests before publication.
- The only homepage renderer is `scripts/editorial_home.py`, using `scripts/editorial.css` and `scripts/editorial.js`. Article CSS and reading interactions live in `scripts/site.css` and `scripts/site.js`. `base_build.py` generates supporting pages and artwork only. Do not restore an old homepage renderer there. Styles/scripts are inlined so reading does not depend on extra requests or JavaScript.
- The root URL and `index.html` are the production site. Retired dynamic renderers and styles must not be restored. `app.js` and `article.js` are only small migration redirects for cached old pages; keep old article links working.
- Keep school information anonymous as “北方某本科高校”. Do not publish specific institution names or earlier education history.
- Preserve first-person Chinese prose. Do not expose credentials, real account positions, or private server connection data.
- Keep an English cover in `assets/covers-en/<article-id>.webp` for each published article. The homepage switches covers with its language control, and English article pages use those covers directly.
- Check article count, unique cover references, old article URL compatibility, and the generated performance budget before publishing.
- Network checks from this execution host are not mainland China tests. Report mainland availability only when an actual mainland test node has been used and its result observed.
