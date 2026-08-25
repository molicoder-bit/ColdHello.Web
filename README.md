# ColdHello - Website

Bilingual product and legal site for the ColdHello app. It uses plain
HTML and CSS with no framework, backend, or build step.

## Pages
- `index.html` - English product landing page
- `privacy.html` - English Privacy Policy
- `terms.html` - English Terms of Use
- `support.html` - English FAQ and contact
- `es/` - complete Spanish equivalents of all four pages
- `assets/style.css` - shared responsive design system
- `assets/app-icon.png` - brand mark and favicon

Set the public App Store and Google Play URLs in `assets/store-links.js`.
Badges remain hidden until the corresponding URL is present.

## Local preview
Serve the repository root so nested Spanish URLs and relative assets are
tested through HTTP:

```
npx serve .
```

Then open the URL printed by the server and check both `/` and `/es/`.

## Deployment
The included GitHub Actions workflow publishes the static site through GitHub
Pages. In repository Settings -> Pages, choose GitHub Actions as the source.
The custom domain is set via `CNAME`; add matching DNS records at the registrar.
