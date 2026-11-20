# Publishing Covert Crew to the stores

Everything the Chrome Web Store and Microsoft Edge Add-ons ask for is in this folder. The only steps left need a grown-up's account.

| What | Where |
|---|---|
| Upload package | Run `build-zip.ps1`, then upload `dist\covert-crew-<version>.zip` |
| Listing text and privacy answers | [LISTING.md](LISTING.md) (copy & paste) |
| Privacy policy link | `https://github.com/codebynatalie/covert-crew/blob/main/PRIVACY.md` |
| Screenshots (1280×800) | `images\screenshot-1-pages.png` … `screenshot-5-settings.png` |
| Small promo tile (440×280) | `images\promo-small-440x280.png` |
| Marquee (1400×560, optional) | `images\promo-marquee-1400x560.png` |
| Store icon, Chrome (128×128) | `..\icons\icon128.png` |
| Store logo, Edge (300×300) | `images\logo-300x300.png` |

## 1. Build the package

```
powershell -ExecutionPolicy Bypass -File store\build-zip.ps1
```

This creates `dist\covert-crew-1.0.0.zip` with only the extension files (no `dev`, `store` or `.git`). It also checks that the description is short enough for Chrome.

## 2. Chrome Web Store

1. Sign in at https://chrome.google.com/webstore/devconsole with the Google account that will own the listing.
   - The account needs 2-Step Verification turned on.
   - There's a one-time developer registration fee, currently $5.
2. Click **New item** and upload the ZIP.
3. On the **Store listing** tab, fill in:
   - Description: the detailed description from LISTING.md
   - Category and language
   - Store icon: `icons\icon128.png`
   - Screenshots: all five
   - Small promo tile, and the marquee if you want it
4. On the **Privacy** tab, fill in:
   - The single purpose
   - A justification for each permission
   - Remote code: **No**
   - Data usage: leave everything unchecked, then tick the three certifications
   - The privacy policy URL

   All of these are in LISTING.md.
5. Optional: on **Distribution**, choose the regions. Under Test instructions, paste the reviewer notes.
6. Click **Submit for review**. Because the extension runs on all websites, the review can take a few days or more.

## 3. Microsoft Edge Add-ons

1. Sign in at https://partner.microsoft.com/dashboard/microsoftedge/overview with a personal Microsoft account and register for the Edge program. It's free.
2. Click **Create new extension** and upload the **same ZIP**.
3. **Availability:** Public, all markets (or pick some).
4. **Properties:**
   - Category: Entertainment
   - Privacy policy URL
   - Website (optional): the GitHub repo link
5. **Privacy page:** fill in the same single purpose, permission justifications and data answers as for Chrome.
6. **Store listing (English):**
   - Description: the detailed description (Edge needs at least 250 characters)
   - Logo: `images\logo-300x300.png`
   - Screenshots
   - Small promo tile and search terms (optional)
7. Click **Publish**. Microsoft's review usually takes up to a week.

## 4. Releasing an update later

1. Bump `"version"` in `manifest.json` (for example `1.0.1`). Both stores reject a package with the same version number as one already submitted.
2. Run `build-zip.ps1` again.
3. Chrome: open the item → **Package** → **Upload new package** → submit.
4. Edge: open the extension → **Update** → upload → publish.

## Redrawing the images

The screenshots are real renders of the extension, staged by `screens\scene.html`. The promo art comes from `screens\promo.html`. After changing either one, or the character art, run:

```
powershell -ExecutionPolicy Bypass -File store\make-images.ps1
```

This uses Microsoft Edge in the background with a throwaway profile, and overwrites the files in `images\`.

## Keep in mind

- Don't mention other shows, movies or brands in the listing (title, description or keywords). The Covert Crew characters are original, and the listing should keep them that way.
- The listing name must match `"name"` in `manifest.json`: **Covert Crew in Tab**.
