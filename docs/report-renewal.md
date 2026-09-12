# Report reading order — 2026-09-11

2026-09-12 report mascot: the user requested a 1.5x display size and removal of the colored rectangle. The shared report now uses `public/mascot/binzip-rabbit-report-transparent-v4.png` (verified alpha channel) at CSS scale 1.5, retaining the text layout. Image blending was removed; printing keeps the prior size. The home mascot is unchanged by this report-only revision.

Current service name: **빈집진단서**. The user approved this rename from 빈집이력서. It is used throughout public/admin screens, accessible labels, page metadata, application-notification subjects, CLI output, and current project headings. The representative mascot remains **집토끼**. Historical planning documents and original generation prompts retain the name recorded when they were created.

2026-09-12: The user selected 3D logo concept B. Shared `LogoMark` and the favicon now use `public/brand/binzip-house-logo-b-3d-v2.png`, a right-side-view cream-and-sage house. Its background is opaque cream, not transparent. The previous flat logo remains archived. The home mascot retains its 1.2 scale and -10px horizontal translation.

User-approved order: sale/demolition cash comparison → three next actions → demolition scope and public support → property records and evidence. The existing 3D rabbit appears beside the short introduction.

The user named the representative rabbit **집토끼**. The home introduction now uses the original transparent 3D house-holding rabbit (`public/mascot/binzip-rabbit-v1.png`) in place of the house drawing. The report keeps its document-inspecting pose and uses the same character name.

The new house-shaped logo (`public/brand/binzip-house-logo-v1.png`) is shared by the home/subpage and report headers and browser favicon. Its built-in image-generation prompt is recorded in `docs/brand/house-logo-v1-prompt.txt`. Header navigation and the duplicate example-report link below the address form were removed: the home keeps the report tab and preview card. The user chose to move the official-resources card immediately before the FAQ, retaining the footer link. Production build, logo loading, two remaining report links, resource-card navigation/order, and 360px home/report layouts were verified; no console errors were observed.

`app/report/report-overview.tsx` is shared by the example report and `ReportDoc` (issued customer report and authenticated admin preview). `src/report-overview-model.ts` adapts existing diagnosis findings without changing the rules engine. Blocking findings and source failures are surfaced before the calculator; detailed findings retain their evidence and unknown state.

The example uses **fictional** amounts: 2,200만원 as-is net cash, 2,250만원 after demolition and sale. `src/disposal.ts` performs integer-won arithmetic on user-entered amounts. Real reports start with blank inputs. Public assessment values are not used as sale prices. Missing/invalid amounts suppress the total; an explicit zero is accepted. Negative totals display the additional cash required. No support is deducted automatically. Calculation inputs stay in React state, are not saved or transmitted, and reset on reload.

This is a cash worksheet, not automated appraisal, tax assessment, demolition quotation, or photo diagnosis. Existing private-photo handling, issued/expiry gates, admin authentication and database schema are unchanged by this report redesign. No production deployment or live-data verification was performed in this local preview.

Validation: typecheck and production build; `scripts/disposal.test.ts`, `scripts/report-overview.test.ts`, and existing `scripts/photos-supports.test.ts` (14 tests total). Browser checks cover amount edits, explicit zero, keyboard deletion to unknown, negative balances, invalid amounts, reset, question copy, evidence/support disclosures, and 360/390px layouts. No browser console errors observed. Native print handling expands report disclosures and restores them afterward; PDF pagination has not been visually verified.

Reference inspected for question-led hierarchy and disclosure patterns: https://zgc.kr/example-report/dangsan-46-29-7 . No reference brand assets were copied.

## Plain-language home and official resources

Home now describes the rural detached-house audience and the sell/demolish/hold decision directly. `/resources` is named **빈집 지원·정보 모음**, as selected by the user. Nine official destinations are organized by national information, Pohang notices, property records, and laws/ordinance. Each explains its purpose and preparation points; this is a curated directory with a review date, not a live eligibility checker or agency partnership.

The user approved the interactive action selector after reviewing the preview. It defaults to **아직 고민 중** and offers reversible sell/demolish/hold radio choices. `src/decision-actions.ts` supplies three distinct actions for each choice, rendered by `app/report/decision-actions.tsx`. These choices do not change diagnosis, eligibility, or calculation inputs. Existing prerequisite warnings remain above the actions. External links do not include property details and use `no-referrer`. Selection stays on the current page and is not saved.

Official sources reviewed on 2026-09-11: https://www.binzibe.kr/main/ ; https://www.greendaero.go.kr/svc/rfph/cpif/front/vacantlist.do ; https://rt.molit.go.kr/ ; Pohang city housing-notice listing; https://www.law.go.kr/법령/농어촌정비법 ; https://www.law.go.kr/법령/빈집및소규모주택정비에관한특례법 ; https://law.go.kr/LSW/ordinInfoP.do?ordinSeq=2075511 . Court and Government24 official pages identify the registry and eais destinations. The ordinance link is a dated version; the card asks users to check later amendments. No interpretation of individual property eligibility was added.

Verified all three action transitions and their destinations while cash totals stayed unchanged; verified home → resource navigation, 9 external links, 390px layouts for all three pages, and a 360px home. Original 14 regression tests and build pass. No live customer records, public deployment, or applications to external agencies were involved.
