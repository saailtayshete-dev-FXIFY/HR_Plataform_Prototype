# Cobalt HR – prototype

A working prototype of an in-house HR system built with **sample data only** (the company "Arcadia Systems" and all 45 people in it are made up).
It is a static site: plain HTML, CSS and JavaScript, with no build step, server or database.

## Put it on GitHub Pages

1. Create a new repository on GitHub, for example `cobalt-hr`.
2. Upload **every file in this folder** to the root of the repository, including the hidden `.nojekyll` file.
   - In the browser: **Add file → Upload files**, then drag in the contents of the folder (not the folder itself) and commit.
   - Or with Git:
     ```bash
     git init
     git add .
     git commit -m "Cobalt HR prototype"
     git branch -M main
     git remote add origin https://github.com/<your-account>/cobalt-hr.git
     git push -u origin main
     ```
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick **main** and **/ (root)**, then **Save**.
5. After a minute or two the site is live at `https://<your-account>.github.io/cobalt-hr/`. The address is shown at the top of the Pages settings.

## Good to know

- **Anyone with the link can open it.** There is no real login; the "Viewing as" switcher in the top bar changes roles. Only ever use sample data.
- **Changes stay in each visitor's own browser** (localStorage). Two people will not see each other's edits. *Settings → Reset demo data* restores the original sample.
- **Private repositories:** GitHub Pages from a private repository needs a paid GitHub plan, and the published site is still public unless your organisation uses GitHub Enterprise Cloud with private Pages.
- **Search engines** are asked not to index the site (`noindex` in `index.html`).
- **Fonts** load from Google Fonts. Everything else is in this folder.

## Files

| File | What it holds |
|---|---|
| `index.html` | Page layout and all styles |
| `data.js` | The sample company, people and records |
| `core.js` | Shared helpers, roles, navigation, approvals |
| `views-*.js` | One file per area: people, time, performance, news, operations, admin |
| `boot.js` | Starts the app, search, theme and role switcher |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |
