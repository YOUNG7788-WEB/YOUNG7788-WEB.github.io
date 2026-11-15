# Security and publication boundaries

The repository is public. Never commit credentials, private drafts, account records or private connection data. A private file is still public once it enters a public Git history, even when Pages excludes it.

`content.json` may contain published entries only. Keep drafts in a separate private workspace. Generators ignore entries unless status is `published` and placeholder is false. The security check also rejects unpublished entries in this public repository.

The public GitHub Pages build uses `_config.yml` to exclude authoring JSON, source scripts and documentation. Do not restore a root `.nojekyll`, which would bypass these exclusions. Public articles, artwork, search data and the intended contact address remain public.

Generated pages have an inline CSP with exact SHA-256 script hashes, no inline event handlers or eval permission, no object, form, base, frame or worker sources, and a no-referrer policy. Inline CSS is intentionally allowed for existing layout and dynamic styles. Every build regenerates hashes from the exact delivered scripts.

Checks: `python scripts/check_site_security.py .`. GitHub Actions runs this check with read-only repository permissions and a pinned checkout action. This check is not a complete secret scanner or penetration test and does not replace branch protection.

## Hosting and account items that remain outside page code

GitHub Pages does not expose arbitrary response-header configuration. Full protection from other sites embedding a page requires `Content-Security-Policy: frame-ancestors 'none'` or `X-Frame-Options` from a header-capable host or proxy. Putting these in HTML meta would not enforce protection. `frame-src 'none'` only prevents this page embedding other frames; it does not prevent other pages embedding this site.

Account 2FA, session review and access-token review require the account owner's GitHub security settings. The current connection does not return the 2FA setting, and its integration permission cannot read or change classic branch-protection settings. Review these at https://github.com/settings/security and https://github.com/settings/tokens . Do not share recovery codes, passwords or tokens in chat.
