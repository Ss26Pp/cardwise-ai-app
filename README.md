# CardWise AI

CardWise AI is a credit card purchase advisor for Indian credit cards. You add your cards (limit, available credit, current balance) and describe a planned purchase. The app then:

- **Purchase Advisor**: recommends the best card from the ones you select, based on each card's reward policy (merchant tiers, online/offline tiers, caps, exclusions), and estimates the reward.
- **Repayment Impact**: shows the updated total due, available credit after the purchase, repayment shortfall, settlement amount, credit utilisation, and potential interest for the card you pay with.
- **Policy Assistant**: answers questions about card policies, fees and repayment rules.
- **My Cards**: manages your card portfolio. Data is stored in Firebase Firestore per signed-in user.
- **Card Catalog**: lists the verified starter cards and lets you quick-add them.

The visual style is a premium black, forest green and champagne gold theme.

## Technology

- A React single-page app delivered as a prebuilt bundle (`public/assets/app.js`). There is no build step.
- Firebase Authentication and Firestore, for sign-in and per-user card storage.
- A theme layer (`public/theme/cardwise-theme.css` and `cardwise-enhance.js`) that restyles the app and draws the realistic card visuals.
- Hosted on Netlify as static files from `public/`.

## Running locally

Any static file server works:

```bash
npx serve public
# or
netlify dev
```

Sign-in uses the Firebase project configured in the bundle. Google sign-in only works on domains listed under **Firebase Console → Authentication → Settings → Authorized domains**. Add `cardwise-ai-app.netlify.app`, plus any custom domain, there.

## How the calculations work

All advisor and repayment numbers are calculated in the browser from the current inputs and your saved card data:

- Estimated reward = eligible purchase amount × the applicable rate for the card, merchant and category, with each card's caps and exclusions applied.
- Updated total due = current balance + purchase amount.
- Available credit after purchase = available credit − purchase amount.
- Repayment shortfall = max(0, purchase amount − repayment capacity).
- Potential interest = shortfall × the card's monthly finance-charge rate. The rate is labelled **Issuer-verified** only when it is confirmed from the issuer's official fee page. Otherwise it is labelled **Estimated**.
