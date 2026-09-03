# ColdHello - Website

Product and legal site for the ColdHello app, in the same 16 languages the
mobile app supports. The published site is plain HTML and CSS with no framework
or backend; the pages are generated from `content/` and committed, so serving
the repository needs no build step.

## Languages
English at the root, the other fifteen in a directory named after their code:

`en` (root), `es`, `pt`, `fr`, `it`, `de`, `nl`, `id`, `tr`, `pl`, `sv`, `no`,
`da`, `ro`, `vi`, `fil`

`index.html` and `support.html` exist for every language. `privacy.html` and
`terms.html` are English and Spanish only, and the other languages link to the
English pages - the same split the mobile app uses, where translated UI strings
ship alongside English and Spanish legal documents.

## Layout
- `content/locales.json` - language list, base URL, contact address, asset version
- `content/<code>.json` - all page copy for one language
- `content/legal/<code>/` - privacy and terms bodies as HTML fragments
- `tools/build.js` - renders the pages; no dependencies
- `assets/style.css` - shared responsive design system
- `assets/lang-picker.js` - closes the header language menu on outside click or Escape
- `assets/store-links.js` - App Store and Google Play URLs
- `assets/app-icon.png` - brand mark and favicon

Generated pages (`index.html`, `support.html`, `<code>/*.html`) are committed.
Edit the JSON, not the HTML - the next build overwrites it.

## Adding or changing copy
```
npm run build
```

The build fails and writes nothing if a language is missing a key that
`content/en.json` defines, or if a list has the wrong number of entries, so a
half-translated file cannot reach the site. Narrow a run to specific languages
while drafting:

```
node tools/build.js fr de
```

To add a language, add it to `content/locales.json`, copy `content/en.json` to
`content/<code>.json`, translate the values, and rebuild.

Set the public App Store and Google Play URLs in `assets/store-links.js`.
Badges remain hidden until the corresponding URL is present.

## Local preview
Serve the repository root so nested language URLs and relative assets are
tested through HTTP:

```
npx serve .
```

Then open the URL printed by the server and check `/`, `/es/`, and a few of the
other language directories.

## Validation
```
npx html-validate "*.html" "*/*.html"
```

## Deployment
The included GitHub Actions workflow publishes the static site through GitHub
Pages. In repository Settings -> Pages, choose GitHub Actions as the source.
The custom domain is set via `CNAME`; add matching DNS records at the registrar.
The workflow uploads the repository as-is and does not run the build, so commit
the generated HTML along with the content changes.
