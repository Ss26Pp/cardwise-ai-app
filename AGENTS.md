# AGENTS.md — CardWise AI

## What this repository is
A static deployment of the CardWise AI React app. The original React/TypeScript source is **not** in this repo. The app ships as a single prebuilt bundle, which has been reformatted with Prettier so it is readable and can be edited in place. There is no build step: Netlify publishes `public/` as-is (see `netlify.toml`).

## Layout
- `public/index.html`: entry HTML. Loads the fonts, the bundle, the app stylesheet and the theme layer.
- `public/assets/app.js`: the whole application, with vendor code (React, Firebase) first and app code at the end (search for the markers below).
- `public/assets/index-DtKx4gGe.css`: compiled Tailwind stylesheet for the app.
- `public/theme/cardwise-theme.css`: the black / forest-green / champagne-gold theme. It overrides Tailwind classes by name, so **don't rename classes in app.js** or the theme stops applying.
- `public/theme/cardwise-enhance.js`: purely decorative DOM layer (card visuals, tilt). It finds elements by class names such as `div.w-48.h-28` and `main label.rounded-xl.border`.
- `public/img/logos/`: issuer and network logos used by the theme.

## Finding things in app.js (minified names)
- `FC`: verified card catalog (reward tiers, exclusions, `interest`, `verification_status`).
- `UC`: detailed policy knowledge base (fees and charges, `monthlyFinancePercent`, FAQs). `WC(name)` looks it up.
- `LC`: exclusion matching (category or merchant against the card's exclusions).
- `RC`: per-card reward evaluation (merchant- and category-specific rules per card id).
- `cwValidateAdvisorInput`, `cwFindCatalogCard`, `cwInterestTerms`, `cwIsOnlineSpend`: helpers used by the engine.
- `zC(input, userCards, catalog)`: the recommendation and repayment engine. It returns `{ recommendedCard, explanation, repaymentSummary, ... }`.
- `HC`: the Purchase Advisor and Repayment Impact component. `view` is `advisor` or `repayment`, and both views share one state.
- `QC`: Policy Assistant. `$C`: Card Catalog. `aw`: My Cards modal. `ow`: app shell. `BS`/`VS`: auth context.
- Firestore helpers: `tw` (list cards), `nw` (add), `rw` (update), `iw` (delete). Collection `user_cards`.

## Conventions and non-obvious decisions
- **Results are derived, never stored.** Clicking Analyze / Recalculate (`oe`) validates, shows a short loading state, then stores only the *inputs* in `cwAnalyzed`. `HC` computes the analysis with `useMemo` from those captured inputs plus the latest card data (`S = zC(...)`). Don't store the result object itself; that caused stale recommendations and repayment values.
- Nothing is shown before the first analysis. If any purchase input changes afterwards (`cwStale`), the result is hidden behind a "Purchase Details Changed" panel until the user analyzes again. Validation messages appear only after the first Analyze attempt (`cwAttempted`). The product name is required and starts empty.
- **No server analysis call.** The old `/api/advisor/analyze` and `/api/catalog` endpoints don't exist on Netlify. Analysis runs entirely client-side. The `/api/catalog` fetch remains, but it is harmless because it falls back to `FC`.
- Numeric form inputs keep the raw text in state, so empty, zero and negative values can be validated. Validation messages come from `cwValidateAdvisorInput`. While inputs are invalid, no recommendation is rendered.
- Repayment Impact uses the card chosen in "Card Used for This Purchase", or the recommended card by default.
- Interest is labelled issuer-verified only when `FC[].interest.status` is confirmed. Otherwise it is labelled as an estimate.
- Keep the existing Tailwind class names and colours when adding UI, so the theme layer styles it automatically.
