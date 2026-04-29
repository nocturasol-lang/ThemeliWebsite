# THEMELI — site

Static bilingual site (HTML/CSS/JS) with a small PHP/SQLite backend for the
admin dashboard, contact-form inquiries, and the projects database.

Built for plain shared-hosting deployment over SFTP — no Docker, no Node.js
runtime, nothing exotic on the server. Apache + PHP 8 + filesystem only.

## Project layout

```
src/                page templates, CSS, JS — built into dist/
public/             copied verbatim into dist/ at build time
  admin/            admin SPA (login, projects, inquiries, map editor)
  api/              PHP backend (session auth + SQLite + JSON endpoints)
    data/           SQLite db lives here, blocked from web by .htaccess
  uploads/          project images uploaded via the admin
scripts/
  seed-projects.php one-time import from the legacy projects-data.js
  deploy.sh         lftp-based SFTP deploy using .env.deploy
build.js            single-file builder → dist/
```

## Local development

```sh
npm install                   # build deps (chokidar, csso, terser)
npm run dev                   # build dist/ in watch mode
php -S localhost:8000 -t dist # serve the built site + PHP API
```

First-run setup of the admin account:

```sh
# 1. seed the DB with existing project metadata (image URLs are stripped —
#    they pointed at the old PocketBase instance; admin re-uploads later)
npm run seed

# 2. create the admin account (replace email + password)
curl -X POST http://localhost:8000/api/auth.php?action=setup \
     -H 'Content-Type: application/json' \
     -d '{"email":"you@themeli.gr","password":"a-strong-password"}'
```

Then open <http://localhost:8000/admin/> to log in.

## Deployment

Set up `.env.deploy` (gitignored) with the host's SFTP credentials — the file
is already in this repo with the field names.

```sh
npm run build:prod    # writes hashed dist/styles.<hash>.css etc.
npm run deploy        # SFTP-syncs dist/ → $FTP_REMOTE_DIR via lftp
```

The deploy script **excludes** `uploads/` and `api/data/` from the sync — so
admin-uploaded images and the SQLite database on the server are never
overwritten by a redeploy.

After the very first deploy:

1. POST `/api/auth.php?action=setup` with `{email, password}` to create the
   admin account on the live host.
2. (Optional) Run `php scripts/seed-projects.php` on the server to bulk-import
   project metadata. Otherwise add projects from the admin UI.
3. Use the admin to upload hero/gallery images per project.
4. Click "Δημοσίευση" — the backend regenerates `projects-data.js` with
   relative `/uploads/projects/...` URLs that are domain-agnostic.

## Backend endpoints (all JSON)

| Method | Path                                | Auth   | Purpose                          |
|--------|-------------------------------------|--------|----------------------------------|
| GET    | `/api/auth.php`                     | —      | session status (+ admin_exists)  |
| POST   | `/api/auth.php`                     | —      | login `{email, password}`        |
| POST   | `/api/auth.php?action=logout`       | admin  | clear session                    |
| POST   | `/api/auth.php?action=setup`        | —      | first-run admin creation         |
| GET    | `/api/projects.php` `[?id=N]`       | admin  | list / single                    |
| POST   | `/api/projects.php`                 | admin  | create                           |
| PATCH  | `/api/projects.php?id=N`            | admin  | update                           |
| DELETE | `/api/projects.php?id=N`            | admin  | delete (also wipes uploads dir)  |
| POST   | `/api/upload.php`                   | admin  | multipart `project_id`+`file`    |
| POST   | `/api/inquiries.php`                | —      | public contact-form submit       |
| GET    | `/api/inquiries.php`                | admin  | list inquiries                   |
| PATCH  | `/api/inquiries.php?id=N`           | admin  | toggle handled / update notes    |
| DELETE | `/api/inquiries.php?id=N`           | admin  | delete                           |
| POST   | `/api/publish.php`                  | admin  | regenerate public projects-data  |

## Email notifications

Disabled by design — shared hosting `mail()` lands in spam too often to be
useful. Inquiries are stored in the DB and surfaced in the admin Αιτήματα
page (with a pending-count badge in the header). If transactional email
becomes worth the cost, drop a vendored PHPMailer into `public/api/lib/`
and add an SMTP send call inside the public-POST branch of `inquiries.php`.

## Backups

The whole app's persistent state lives in two places on the server:
`api/data/themeli.sqlite` and `uploads/projects/`. A nightly cron job that
tars both and copies them off-host is plenty.
