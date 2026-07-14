# Unified Template Contract & Mobile-First Classic Design

## Product outcome

FrameID serves freelance photographers and their mobile visitors. Every template therefore exposes the same platform capabilities and dashboard controls; themes differ only in presentation.

## Contract

The platform capability set is Hero, Gallery, Packages, Extras, and Contact. Every section owns visibility, persisted order, title/description, and typed presentation settings. Renderers iterate the normalized order and cannot add business logic or omit supported data.

Hero is dashboard-owned: image, overlay, position, height, eyebrow, CTA label and target. Contact uses large phone-friendly actions for phone, WhatsApp, Instagram, Facebook, TikTok, optional email, and a free-text work location defaulted to `فريلانسر`. No map is rendered.

## Rendering

Static structure remains server-rendered. A focused client provider owns package/extra selection and booking CTA state. Mobile uses a 64px header, horizontal snap cards, 44px+ targets, a compact extras list, and a safe-area booking bar.

## Compatibility

Historic missing sections/settings are filled by normalization defaults. Structured editor updates preserve unknown compatible JSON fields. The additive database migration backfills work location without removing legacy address columns.
