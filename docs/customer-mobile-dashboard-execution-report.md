# Customer Mobile Dashboard Execution Report

Branch: `feature/customer-mobile-guided-journey`

## Execution prompt distilled from the request

Rebuild the customer dashboard as a simple mobile-first guided journey for a normal photographer who may not understand technical settings.

The target order is:

1. Home page starts with activation/trial alert.
2. Public site link card immediately below it, tap/copy behavior.
3. Thin readiness card.
4. `اكمل بيانات موقعك` card.
5. Stages ordered as:
   - Packages
   - Contact data
   - Photos
   - Publish
6. Reduce repeated cards and make every stage feel like a practical workspace.

## Implemented changes

### 1. Mobile-first dashboard home

Updated:

- `src/app/(dashboard)/dashboard/home-client.tsx`
- `src/modules/dashboard/dashboard-view-model.ts`
- `src/app/(dashboard)/dashboard/page.tsx`

Implemented:

- top one-line activation/trial banner
- direct activation button
- site link card with tap-to-copy behavior
- compact readiness card
- renamed `خطة اليوم` to `اكمل بيانات موقعك`
- removed repeated workspace/stage cards from the home screen so contact/packages/photos do not appear multiple times
- improved contrast for cards, rows, borders, labels, highlight states, and CTA hover states while staying close to the existing dark/gold design language
- journey order changed to packages, contact, photos, publish
- avatar and uploaded cover now count in readiness

### 2. Mobile navigation order

Updated:

- `src/components/layout/dashboard-shell.tsx`

New mobile order:

1. الرئيسية
2. الباقات
3. التواصل
4. الصور
5. النشر

Secondary tools remain under:

- شكل الموقع
- التفعيل والدفع
- الإعدادات

### 3. Packages workspace

Updated:

- `src/app/(dashboard)/dashboard/services/page.tsx`
- `src/app/(dashboard)/dashboard/services/services-client.tsx`
- `src/app/(dashboard)/dashboard/services/actions.ts`

Implemented:

- simplified intro
- removed noisy stats/search-first layout
- packages are the first stage
- package edit supports:
  - title
  - description/subtitle
  - price
  - currency
  - active/hidden
  - most requested badge
  - feature rows with add/delete row
- extras support:
  - title
  - description
  - price
  - currency
  - icon key
  - highlighted badge
  - active/hidden
- end-of-stage footer with:
  - completion percent
  - home button
  - next stage button to contact data

### 4. Contact workspace

Updated:

- `src/app/(dashboard)/dashboard/site-info/site-info-client.tsx`
- `src/app/(dashboard)/dashboard/site-info/actions.ts`

Implemented:

- removed working hours from the UI
- removed avatar/cover upload from contact page
- page now only contains:
  - identity card
  - contact card
- `اسم الحساب` is now handled as `اسم المصور`
- identity fields:
  - photographer name
  - studio/brand/company name
  - short bio
  - story/long description
- contact fields:
  - phone
  - WhatsApp
  - Facebook
  - Instagram
  - TikTok
  - optional email
- WhatsApp field normalizes:
  - Arabic digits
  - Egyptian local numbers like `010...`
  - `00` international numbers
  - plain numbers into `https://wa.me/...`
- autosave on field blur / moving between fields
- footer with home button and next button to photos

### 5. Photos workspace

Updated:

- `src/app/(dashboard)/dashboard/gallery/page.tsx`
- `src/app/(dashboard)/dashboard/gallery/gallery-client.tsx`
- `src/app/(dashboard)/dashboard/gallery/actions.ts`

Implemented:

- page renamed conceptually to `الصور`
- profile image card moved here
- cover image card moved here
- albums are now part of the photos stage
- album notes added:
  - `دي صور من أعمالك تظهر للعميل`
  - `يفضل لو تسيبها بعد ما تتأكد إن كل حاجة شغالة تمام في موقعك`
- create album with title and description
- album cards with edit/delete
- inside album:
  - edit title/description
  - upload images
  - set cover
  - mark featured
  - reorder
  - delete image
- capped each album to 5 images for now
- first uploaded image becomes album cover if no cover exists
- footer with completion percent and next button to publish

## What still should be adjusted in the public website

1. Public profile rendering should prioritize the new photo workflow:
   - ContactProfile.avatarAsset as profile image
   - ContactProfile.coverAsset as main hero cover if no section-specific hero image exists

2. Public package display should show:
   - `isHighlighted` as `الأكثر طلباً`
   - feature rows as clean bullet list
   - hidden packages/extras should not appear

3. Public gallery rendering should respect:
   - album cover
   - album description
   - max 5 current images per album if this is now the product rule

4. Public contact buttons should prioritize:
   - WhatsApp
   - phone
   - Instagram
   - Facebook
   - TikTok

## What should be adjusted in the Super Admin

1. Customer 360 should show the new journey readiness:
   - packages ready
   - contact ready
   - avatar uploaded
   - cover uploaded
   - album count
   - publish state
   - billing state

2. Site Workspace should show customer-facing media health:
   - avatar present/missing
   - cover present/missing
   - albums count
   - images count

3. Admin support should be able to see where a customer is stuck:
   - no package
   - no WhatsApp
   - no profile image
   - no album images
   - trial not activated

4. Payment/Billing admin should reference the top dashboard banner:
   - pending review
   - trial expiring soon
   - rejected proof

## What should be adjusted in seed/templates

1. Avoid marking default packages as customer-complete unless they are actual customer-created or accepted content.
2. Consider adding a field later such as `source = TEMPLATE | CUSTOMER` for packages/extras.
3. Add starter examples as drafts/hidden instead of active completed content.

## Validation notes

GitHub connector changes were pushed to the branch. Local build/test execution is not available in this environment, so run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

before merging/deployment.
