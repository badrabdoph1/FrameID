# Customer Dashboard Mobile Journey Execution Prompt

## Objective

Rebuild the customer dashboard journey for normal non-technical photographers on mobile.

The dashboard must feel like a simple guided setup path, not a technical admin panel.

## Required mobile home order

1. One-line admin/trial alert at the very top:
   - message like: `حسابك تجريبي برجاء التأكد من التفعيل`
   - direct activation button.

2. Site link card:
   - show public site URL
   - tapping/copy button copies the link.

3. Thin site readiness card:
   - keep the premium style
   - make it compact and mobile-friendly.

4. Today's plan card:
   - remove any false default done state for packages.
   - packages should only be complete when the customer creates their own custom package.

5. Then show journey/workspace cards.

## Required journey order

1. Packages first.
2. Contact data second.
3. Photos third.
4. Launch/publish later.

## Packages workspace

- Remove noisy intro and useless stats.
- Existing package cards must be editable.
- Edit mode must allow editing:
  - title/name
  - description/subtitle
  - price/currency
  - highlighted/badge/most requested state
  - features as separate rows
  - add feature row
  - delete feature row
- Extras must follow same UX.
- End of page:
  - next-step button to contact data
  - home button
  - compact completion card.

## Contact workspace

- Remove working hours completely.
- Keep only two cards:
  1. Identity/basic data
  2. Contact data
- Rename account name label to `اسم المصور`.
- Identity fields:
  - photographer name
  - studio/brand/company name
  - short bio
  - story/long description
- Contact fields:
  - phone
  - WhatsApp phone/link
  - Facebook
  - Instagram
  - TikTok
  - email optional
- WhatsApp field:
  - if user enters a phone number, automatically convert it to a WhatsApp link.
  - support Egypt and Arab countries by normalizing Arabic digits and common local formats.
- Autosave on field blur/change between fields.
- End of page:
  - next-step button to photos
  - back home button.

## Photos workspace

- Rename to `الصور`.
- First card: photographer profile image.
  - square crop UX.
  - allow moving/previewing image before upload as much as possible in simple UI.
- Second card: main cover image.
- Third card: albums inside this same photos workspace.
  - note: `دي صور من أعمالك تظهر للعميل`.
  - note: `يفضل لو تسيبها بعد ما تتأكد إن كل حاجة شغالة تمام في موقعك`.
  - create album.
  - upload album cover.
  - album cards with edit/delete.
  - inside each album allow title, description, and up to 5 images per album for now.
- End of page:
  - next-step button.
  - completion card.

## Other dashboard changes

- Sidebar/mobile navigation should reflect the new order:
  - الرئيسية
  - الباقات
  - التواصل
  - الصور
  - النشر
- Make all copy simpler for a normal user.

## Follow-up report

After implementation, document what still needs to be adjusted in:

- public website rendering
- super admin console
- billing/admin review flow
- templates/seed data
