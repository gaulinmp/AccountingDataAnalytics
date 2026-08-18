# Origin-trial token renewal (`<ai-tutor>`)

The web **Prompt API** (`window.LanguageModel` / Gemini Nano) is shipping behind a
**Chrome origin trial** until it stabilizes (~Chrome 145–150, spec §5.2). Until
then, the on-device tier only activates on pages that present a valid
**origin-trial token** for the exact deployed origin.

Without a valid token the tutor silently degrades to the **copy-paste tier** — it
still works, just not on-device. So a lapsed token is a quiet regression, not a
crash. Track it here.

## Current token

| Field | Value |
|------|-------|
| Origin | _(set when deployed — must match exactly, incl. subpath rules)_ |
| Token | _none yet — see "How to add" below_ |
| Registered | — |
| **Expires** | — |

> Update this table whenever the token is (re)issued. Origin-trial tokens are
> typically valid for ~6 weeks per registration.

## How the token is wired

`site/src/components/layout/Layout.astro` emits the meta tag **only when** the
build sees a token in the environment:

```astro
{OT_TOKEN && <meta http-equiv="origin-trial" content={OT_TOKEN} />}
```

Set it at build time (and in CI) via a public env var:

```bash
PUBLIC_OT_TOKEN="<token-string>" npm run build
```

When unset (local dev, no token), the meta is simply omitted and the tutor uses
the copy-paste tier.

## How to add / renew a token

1. Go to the **Chrome Origin Trials** console and register for the **Prompt API
   (Built-in AI)** trial for the deployed origin (e.g. `https://<user>.github.io`
   or the custom domain).
2. Copy the issued token string and note its **expiry date** in the table above.
3. Provide it to the build as `PUBLIC_OT_TOKEN` (a GitHub Actions secret →
   build env in Stage 8's workflow).
4. Redeploy and confirm on the live origin that `'LanguageModel' in window` is
   `true` in a current Chrome.

## When it expires

- The on-device tier stops activating; users fall to copy-paste (no error).
- Re-register (step 1), update the table + the build secret, redeploy.
- Consider a `/schedule` reminder a few days before the **Expires** date once a
  real date exists.
