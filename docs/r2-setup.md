# Cloudflare R2 Bucket Setup Guide

> Required for prize image uploads via the admin panel.

---

## 1. Create Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → sign up / log in
2. Enable **R2** from the sidebar — requires a payment method (free tier: 10 GB storage, 1M Class A ops/month, 10M Class B ops/month — ₤0/month for light use)

---

## 2. Create Bucket

```
R2 → Create bucket → name: golden-dream-draw → region: auto
```

Keep the bucket **public** for direct image URLs.

---

## 3. Make Bucket Public

Go to your bucket → **Settings** → **Public access**:

```
Public bucket URL: https://pub-<hash>.r2.dev
```

Copy this URL — it's your `R2_PUBLIC_URL`.

---

## 4. Generate Access Keys

```
R2 → Manage R2 API Tokens → Create API Token
```

- **Permission:** Admin Read & Write
- **TTL:** Never (or set a long expiry)

Copy the two values that appear **once**:

| Token field | Env var |
|---|---|
| `Access Key ID` | `R2_ACCESS_KEY_ID` |
| `Secret Access Key` | `R2_SECRET_ACCESS_KEY` |

---

## 5. Get Your Endpoint

```
R2 → your bucket → Properties → Endpoint
```

It looks like:
```
https://<account-id>.r2.cloudflarestorage.com
```

This is your `R2_ENDPOINT`.

---

## 6. Fill Env Vars

Add to `.env.local` (and Vercel dashboard for production):

```env
R2_ACCESS_KEY_ID=<from step 4>
R2_SECRET_ACCESS_KEY=<from step 4>
R2_BUCKET_NAME=golden-dream-draw
R2_ENDPOINT=<from step 5>
R2_PUBLIC_URL=<from step 3>
```

---

## 7. Set CORS (optional, needed if loading images from browser)

Go to your bucket → **Settings** → **CORS** → add:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"]
  }
]
```

---

## 8. Verify

1. Restart dev server
2. Go to `/en/admin/competitions/new` → upload an image
3. If R2 env vars are missing, the fallback saves to `public/uploads/` instead — no crash.

---

## Debug

| Symptom | Cause |
|---|---|
| Upload returns 401 | Invalid `R2_ACCESS_KEY_ID` or `R2_SECRET_ACCESS_KEY` |
| Upload succeeds but URL 404s | `R2_PUBLIC_URL` wrong, or bucket not public |
| Upload stuck | `R2_ENDPOINT` wrong (check for trailing slash) |
| Fallback used | One or more R2 env vars missing → check `.env.local` |
