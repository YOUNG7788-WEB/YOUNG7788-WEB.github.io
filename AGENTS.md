# Publishing this website

The public website is generated static HTML on free GitHub Pages. Keep hosting free and preserve all existing articles and distinct cover images.

- `content.json` is the authoring source. `index.html`, `lite.html`, and `posts/*.html` are generated. Updating only JSON does not update the published pages.
- Run `scripts/build_site.py` after editing source content. It uses Pillow and the full cover files referenced by `categoryImages` and each item's `image`.
- Build into a staging directory, then copy every file listed in its `publish-manifest.json` into the repository. Preserve existing full-resolution assets. Commit generated pages with the content change.
- CSS and interaction source live in `scripts/site.css` and `scripts/site.js`. They are inlined into generated pages so reading does not depend on additional requests or JavaScript.
- The root URL and `index.html` are the production site. Retired dynamic renderers and styles must not be restored. `app.js` and `article.js` are only small migration redirects for cached old pages; keep old article links working.
- Keep school information anonymous as “北方某本科高校”. Do not publish specific institution names or earlier education history.
- Preserve first-person Chinese prose. Do not expose credentials, real account positions, or private server connection data.
- Check article count, unique cover references, old article URL compatibility, and the generated performance budget before publishing.
- Network checks from this execution host are not mainland China tests. Report mainland availability only when an actual mainland test node has been used and its result observed.
