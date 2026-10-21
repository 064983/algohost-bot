# Algohost Bot website

A responsive Next.js storefront for selling **existing trading-bot activation IDs**. This project does not distribute bot files or source code and does not generate activation IDs. An administrator must manually assign an ID that is valid for the customer's bot.

## Before you accept orders

The GitHub repository supplied for this project was empty when checked. No bot software or licensing mechanism was available to inspect. The sample products/prices are placeholders. This is an application starter—not a live payment-ready store until you configure Supabase, Paystack, deployment, and valid licensing IDs.

In particular:

- Confirm each product, platform/version compatibility, price, category, activation instructions, and valid ID with the actual bot owner.
- Review and complete the draft [terms and refund policy](./app/terms/page.tsx) and [privacy notice](./app/privacy/page.tsx).
- Paystack/ZAR availability depends on your account and current provider eligibility. Verify this with Paystack before enabling checkout.
- Never put a service-role key, Paystack secret, GitHub token, or customer activation ID in frontend code or a public repository.

## Run on your computer

Install Node.js (LTS) and GitHub Desktop. Open PowerShell in this folder and run:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The storefront design loads, but catalog checkout, sign-in, orders, and admin data need the services below. Do not use test values as live product data.

## Connect Supabase (database and customer accounts)

1. Create a Supabase project and keep its database password private.
2. In the Supabase project, open **SQL Editor**, create a query, paste all of [`supabase/schema.sql`](./supabase/schema.sql), and run it. It creates the database tables, row-level security policies, starter catalog, and admin-only ID assignment functions.
3. The setup SQL also creates a public product-image bucket that limits uploads to JPG, PNG, or WebP files up to 5 MB and permits uploads only for authenticated administrators.
4. In **Project Settings > API**, copy the Project URL, anon/public key, and service-role key into `.env.local`:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
   PAYSTACK_SECRET_KEY=
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   The anon key is intended for the browser and is protected by database RLS. The service-role key bypasses RLS: only use it on the server or in deployment environment settings. Never commit `.env.local`.
5. In **Authentication > URL Configuration**, add `http://localhost:3000/**` and `https://YOUR-DOMAIN/**` to allowed redirect URLs. Configure email sign-in delivery for your Supabase project.
6. Start the site again after changing `.env.local`.
7. Register/sign in to the site once with the email that should manage the store. In Supabase **Table Editor > profiles**, change only that user's `role` from `customer` to `admin`. Do not make customer accounts admins.
8. Visit `/admin` while signed in with that account.

## Configure Paystack

1. Apply for and configure a Paystack merchant account that is eligible to accept your business's payments in ZAR. Confirm currency and settlement details with Paystack first.
2. In your hosting provider's server-side environment settings, set `PAYSTACK_SECRET_KEY` using the secret key from your Paystack dashboard. Do not use a test key for real orders and never add the secret to a `NEXT_PUBLIC_` variable.
3. Set `NEXT_PUBLIC_SITE_URL` to the exact HTTPS production URL.
4. Add a Paystack webhook URL: `https://YOUR-DOMAIN/api/paystack/webhook`.
5. Use Paystack test mode first. The server creates a pending order, initializes checkout using a server-held secret, validates the signed webhook, independently verifies the transaction with Paystack, and checks reference, amount, and currency. The browser return page never marks an order paid. Admins can request full refunds through Paystack; the order changes to Refunded only after Paystack sends its signed refund notification.
6. Test a completed, cancelled, failed, and mismatched payment. Check that only a verified successful transaction changes status to Paid. Do not switch to live keys until the business account is approved and the tests pass.

No bank-deposit proof upload is implemented. If you accept manual transfers outside this site, keep them Pending and verify them yourself; a receipt upload must never automatically mark an order paid.

## Products and valid activation IDs

- Replace or edit sample products under `/admin`; enter verified prices and descriptions, platform/version, features, and activation instructions.
- To hide a listing, use **Remove** (it deactivates it; it does not delete existing orders).
- Once payment has been verified, enter the **existing, valid** activation ID in that paid order's admin row. The database prevents an ID value from being assigned twice. Assigning a replacement deactivates the previous ID and records the action in history; revoke is also audited.
- A customer can read an ID only from their signed-in account, and only for a paid order with an active assignment. Never send an ID in a public product listing or paste it into source files.
- This project cannot confirm whether an ID activates your actual software. Test IDs and instructions against your real bot licensing system before sale.
- The admin screen shows recent orders, customer contact/comments, payment status, ID history, customer messages, and a basic paid-total summary. Checkout is limited to five attempts per account per ten-minute window; follow-up messages are limited to five per order per account per ten-minute window and ownership is checked by the database function. Administrators can upload JPG, PNG, and WebP product images up to 5 MB, and request full Paystack refunds for verified transactions. The WhatsApp support number can be changed in the admin dashboard using international digits-only format (for example `27649838898`). Manual deposits and automatic ID generation are not configured; general page copy is in the `app` files.

## GitHub: open and update the project

The project is published at `https://github.com/064983/algohost-bot`. To work on it in VS Code:

1. Open GitHub Desktop and sign into your GitHub account.
2. Choose **File > Clone repository**, select `064983/algohost-bot`, choose a folder to store it, and click **Clone**.
3. In GitHub Desktop, click **Open in Visual Studio Code**. If asked which application to use, select VS Code.
4. In VS Code, choose **File > Open Folder** if prompted and open the cloned `algohost-bot` folder. Open the integrated terminal using **Terminal > New Terminal**.
5. Install dependencies with `npm install`, then start the development site with `npm run dev`. Open `http://localhost:3000`.
6. To make an update, edit and save the project files in VS Code. In GitHub Desktop, review the changed files, enter a short summary, click **Commit to main**, and then **Push origin**.

You can also clone from the VS Code Source Control view using **Clone Repository**, paste `https://github.com/064983/algohost-bot.git`, and sign into GitHub when VS Code requests it. Never copy `.env.local` or publish real payment or database credentials. Content and WhatsApp defaults are in `lib/config.ts`; products and prices are managed in `/admin` after database setup.

## Deploy to Render

1. Push the project to the `main` branch of the GitHub repository.
2. Sign in to Render and choose **New > Blueprint**. Connect GitHub if prompted, select `064983/algohost-bot`, and deploy the `render.yaml` blueprint.
3. Render creates a Node.js web service using `npm ci && npm run build` and `npm start`. Choose a plan that suits you. Free web services can sleep while idle; use an always-on plan before accepting payments so buyers and payment notifications are not delayed by cold starts.
4. In the Render service's **Environment** settings, add these required values. Copy the Supabase URL and anon key from **Supabase > Project Settings > API**, and keep the service-role key and Paystack secret private:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — server secret; never expose it to browsers
   - `PAYSTACK_SECRET_KEY` — server secret; begin with the provider's test key
   - `NEXT_PUBLIC_SITE_URL` — the complete HTTPS Render service URL, for example `https://algohost-bot.onrender.com`

   Do not commit or paste secret values into `render.yaml`, GitHub, or a `NEXT_PUBLIC_` variable.
5. Save the environment variables and trigger a deploy from Render. After the service is live, copy its exact HTTPS URL into `NEXT_PUBLIC_SITE_URL` and save/redeploy if necessary.
6. In Supabase **Authentication > URL Configuration**, allow the production URL for sign-in redirects. Set the Paystack webhook to `https://YOUR-RENDER-DOMAIN/api/paystack/webhook`.
7. Test sign-in, checkout, successful and failed payments, webhook verification, and private ID access using provider test mode. Do not enable live payments until a valid ID has been tested with the actual bot and you have completed the privacy and refund policies.

The Render Blueprint intentionally prompts you to enter environment values in the service settings; it does not put credentials in source control.

## Useful checks

```powershell
npm run typecheck
npm run lint
npm run build
```

## Pages and key implementation

- Storefront: [`app/page.tsx`](./app/page.tsx)
- Checkout and products: [`app/checkout`](./app/checkout), [`app/bot`](./app/bot)
- Customer orders: [`app/account/page.tsx`](./app/account/page.tsx)
- Admin: [`app/admin/page.tsx`](./app/admin/page.tsx)
- Payment initialization and signed Paystack webhook: [`app/api`](./app/api)
- Database schema, access policies, and ID assignment audit: [`supabase/schema.sql`](./supabase/schema.sql)
