# Meta Tracking Implementation (Pixel + CAPI)

This project uses:

- Meta Pixel ID: `1458255249041584`
- Conversions API endpoint: `/api/meta-capi`

## Architecture

1. Browser sends events through `fbq(...)` (Pixel).
2. Browser sends the same event to `/api/meta-capi`.
3. `/api/meta-capi` forwards event to Meta Graph API using your token.
4. `event_id` is shared between Pixel and CAPI for deduplication.

## Implemented Events

### 1) `PageView`

- Trigger: Pixel base code on page load.
- Purpose: baseline traffic.

### 2) `ViewContent`

- Trigger: each key section enters viewport once (`IntersectionObserver`, threshold `0.35`).
- Sections:
  - `hero`
  - `steps`
  - `why_choose_us`
  - `clients_and_scenarios`
  - `final_cta`
- Custom data:
  - `section_name`
  - `content_category = section_view`
  - `content_name = siemens_plc_buyback_page`

### 3) `Contact`

- Trigger: click on links with `data-track-contact`.
- Channels: `whatsapp`, `telegram`, `email`
- Positions:
  - `topbar`
  - `hero`
  - `hero_card`
  - `final_cta`
  - `floating`
- Custom data:
  - `channel`
  - `position`
  - `content_category = contact_click`
  - `content_name = siemens_plc_buyback_contact`

### 4) `Lead`

- Trigger: click on `whatsapp` or `telegram` links.
- Custom data:
  - `channel`
  - `position`
  - `lead_type = direct_messaging`
  - `content_name = siemens_plc_buyback_lead`

## Files and Responsibilities

- `index.html`
  - Pixel base code
  - contact link tagging (`data-track-contact`, `data-channel`, `data-position`)
  - section tagging (`data-track-section`)
- `script.js`
  - event ID generation
  - Pixel dispatch
  - CAPI dispatch to `/api/meta-capi`
  - section view and contact click logic
- `api/meta-capi.js`
  - receives frontend events
  - forwards to Meta Graph API
  - includes `client_ip_address` and `client_user_agent`

## Event Parameters to Watch in Meta

- `channel`
- `position`
- `section_name`
- `lead_type`

Use these to build custom conversions and compare conversion quality by entry point.

## Recommended Custom Conversions

1. `Lead` where `channel = whatsapp`
2. `Lead` where `channel = telegram`
3. `Contact` where `channel = email`

## Validation Steps (Meta Events Manager)

1. Open Events Manager -> your Pixel.
2. Open `Test Events`.
3. Visit site and click:
  - topbar WhatsApp
  - hero Telegram
  - final Email
4. Confirm receiving:
  - `PageView`
  - `ViewContent`
  - `Contact`
  - `Lead`
5. Confirm no high duplicate rate due to `event_id` deduplication.

## KPI Suggestions

1. `Contact Rate = Contact / PageView`
2. `Lead Rate = Lead / PageView`
3. Channel split:
  - `Lead(whatsapp) / Lead(total)`
  - `Lead(telegram) / Lead(total)`
4. Position efficiency:
  - compare `position` in `Contact` and `Lead`

## Notes

- Current setup uses your token directly in `api/meta-capi.js`.
- For production security, move token to Vercel Environment Variables in a later step.
