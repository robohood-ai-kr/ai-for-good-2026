---
name: Physical AI Operations
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#2c4bb9'
  on-tertiary: '#ffffff'
  tertiary-container: '#4865d4'
  on-tertiary-container: '#eff0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#dde1ff'
  tertiary-fixed-dim: '#b8c4ff'
  on-tertiary-fixed: '#001453'
  on-tertiary-fixed-variant: '#173bab'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 48px
  headline-lg-mobile:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 36px
  headline-md-mobile:
    fontFamily: Noto Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 33px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-lg-medium:
    fontFamily: Noto Sans
    fontSize: 17px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md-medium:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-md:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
  label-sm:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

### Brand Personality & Philosophy
This design system defines an industrial Physical AI operational workspace engineered for manufacturing execution, plant teleoperation, and automation analytics. The brand character projects **rigorous technical precision, clarity, and dependable authority**, balanced with approachable clarity for operational teams on the factory floor and in monitoring centers.

### Visual Style: Modern Industrial Precision
- **Style archetype**: Corporate / Modern with KRDS (Korean Design System) accessibility compliance.
- **Atmosphere**: Professional light theme engineered for multi-display factory control rooms, office terminals, and operational tablets.
- **Structural purity**: Flat white structural surfaces layered cleanly over an engineered slate-tinted canvas (`#F4F7FB`). Strong contrast ratios ensure rapid scannability under industrial lighting conditions.
- **Anti-patterns**: Gratuitous dark neon palettes, decorative glassmorphism, black main action buttons, floating cards without bounds, and ambiguous icons lacking text labels.

## Colors

### Core Color Roles
- **Primary (`#2563EB`)**: High-visibility operational blue reserved for primary calls-to-action, key state indicators, and active workflow anchors.
  - Hover: `#1D4ED8`
  - Pressed: `#1E40AF`
  - Selected Surface: `#EFF6FF`
- **Secondary / Slate Gray (`#475569`)**: Structural secondary text, column meta-data, secondary controls, and passive indicators.
- **Tertiary / Informational Anchor (`#1E40AF`)**: Deep cobalt for system-level notifications, breadcrumbs, and selected accents.
- **Neutral Primary Text (`#0F172A`)**: High-legibility deep slate navy for headline typography, numeric sensor readings, and key labels.

### Surface & Border Architecture
- **Canvas Base**: `#F4F7FB` (cool industrial tint eliminating monitor glare)
- **Card & Modal Surface**: `#FFFFFF`
- **Sidebar & Table Header Surface**: `#F8FAFC`
- **Subtle Structural Border**: `#D5DDE7`
- **Form Input Border**: `#64748B` (meets WCAG AA 3:1 boundary contrast requirements)

### Strict Status Token Hierarchy
Colors must never be used in isolation; each status must pair color with an unambiguous Korean text label and an accessible icon. Green is exclusively restricted to operational success.

- **성공 (Success)**: Text & Icon `#166534`, Container `#F0FDF4`, Border `#BBF7D0`. Never used as brand coloring.
- **주의 (Warning)**: Text & Icon `#92400E`, Container `#FFFBEB`, Border `#FDE68A`.
- **위험/오류 (Critical/Error)**: Text & Icon `#B91C1C`, Container `#FEF2F2`, Border `#FECACA`.
- **안내/정보 (Info)**: Text & Icon `#1E40AF`, Container `#EFF6FF`, Border `#BFDBFE`.

## Typography

### Font Stack & Typographic Principles
- **Primary Typeface**: Noto Sans KR (fallback to Pretendard GOV / Pretendard in local implementations).
- **Metric Rhythm**: Fixed 1.5 line-height ratio across all text levels ensures effortless eye-tracking in complex data tables and industrial dashboards.
- **Numerical Tabular Alignment**: All sensor metrics, cycle durations, defect counts, and telemetry streams must render with `font-variant-numeric: tabular-nums`.

### Scale Application Guide
- **Headline Large (32px / Mobile 24px, 700)**: Dashboard main screen headers and primary teleoperation station titles.
- **Headline Medium (24px / Mobile 22px, 600)**: Card section headers, analytics group titles, and modal titles.
- **Body Large (17px, 400 & 500)**: Form inputs, interactive button labels, dialog body descriptions, and high-priority alerts.
- **Body Medium (16px, 400 & 500)**: Data table cells, navigation tree items, sidebar links, and structured telemetry rows.
- **Label Medium (15px, 500)**: Secondary field descriptors, metadata captions, and status badge labels.
- **Label Small (13px, 600)**: Micro-tags, table column headers (all-caps or bolded Korean text), and unit labels (e.g., `RPM`, `mm/s`).

## Layout & Spacing

### Shell & Frame Structure
- **Fixed Top Header**: 64px fixed height, anchored at `z-index: 1100`, containing the persistent simulation indicator, facility selector, system diagnostics, and operator profile.
- **Navigation Sidebar**: Fixed 240px width on desktop displays, rendered in `#F8FAFC` with a 1px border (`#D5DDE7`) on the right. Collapsible to a 64px icon rail on small laptop viewports.
- **Canvas Work Area**: Fluid background (`#F4F7FB`) with an 8px modular spacing baseline.

### Responsive Breakpoints & Grids
- **Desktop (>= 1280px)**: 12-column grid, 24px (`1.5rem`) margins and gutters. Sidebar pinned at 240px.
- **Tablet / Line Terminal (768px - 1279px)**: 8-column grid, 20px gutters, collapsible overlay sidebar.
- **Mobile Handheld (< 768px)**: 4-column fluid stack, 16px (`1rem`) margins and gutters, full-width cards.

## Elevation & Depth

### Atmospheric Strategy
Depth is established through structural surface color contrast and crisp low-opacity outlines rather than multi-layered dropshadows. This eliminates visual dirt on industrial LCD panels.

### Elevation Levels
- **Level 0 (Base / Canvas)**: `#F4F7FB`. Flat, non-interactive foundation.
- **Level 1 (Cards, Modules & Panels)**: `#FFFFFF` surface with a crisp structural outline (`1px solid #D5DDE7`) and a restrained ambient drop shadow:
  `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05);`
- **Level 2 (Dropdowns, Flyouts & Tooltips)**: `#FFFFFF` surface, `1px solid #D5DDE7`, with medium dispersion:
  `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05);`
- **Level 3 (Modals & Critical Intervention Dialogs)**: `#FFFFFF` surface, paired with a tinted backdrop overlay (`rgba(15, 23, 42, 0.45)`):
  `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05);`

## Shapes

### Corner Curvature Rules
- **Containers & Cards (`12px`)**: Applied to all dashboard metric panels, data table enclosures, and modal wrappers to introduce refined approachability.
- **Interactive Controls & Fields (`8px`)**: Applied strictly to buttons, text input fields, dropdown triggers, and select menus for crisp target acquisition.
- **Badges & Status Tags (`6px`)**: Rectilinear badges with minimal softening to maintain structured information density. Pill shapes are strictly prohibited for status indicators to prevent confusion with rounded action buttons.

## Components

### Top Header Persistent Simulation Badge
- **Content**: `'제조업 v1 · 데모 데이터'` (Strictly mandatory. Explicitly excludes government insignia or e-Gov marks).
- **Styling**: `#1E40AF` text on `#EFF6FF` background with `1px solid #BFDBFE` border. Font size 13px, weight 600, padding `4px 10px`, border-radius `6px`. Rendered prominently adjacent to the primary workspace breadcrumb.

### Buttons
- **Primary Button**: Solid `#2563EB`, text `#FFFFFF`, radius 8px, font size 17px, font weight 500. Height 44px (minimum industrial tap target). Hover: `#1D4ED8`. Active: `#1E40AF`.
- **Secondary Button**: Surface `#FFFFFF`, border `1px solid #D5DDE7`, text `#0F172A`. Hover: `#F8FAFC` and border `#64748B`.
- **Destructive Button**: Solid `#B91C1C`, text `#FFFFFF`. Reserved strictly for physical e-stop, process abortion, or irreversible data operations.
- **Constraint**: Pure black (`#000000`) buttons are strictly prohibited.

### Form Inputs & Fields
- **Container**: Surface `#FFFFFF`, border `1px solid #64748B`, radius 8px, height 44px, text size 17px (`#0F172A`).
- **Focus State**: Border `#2563EB` with `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18)`.
- **Labels**: Always external, positioned directly above input fields at 15px font size with `#0F172A` weight 500.

### Cards & Panels
- **Container**: Surface `#FFFFFF`, border `1px solid #D5DDE7`, radius 12px, padding 24px (`space-lg`).
- **Header Structure**: Border bottom `1px solid #F1F5F9`, padding bottom 16px. Section title in 24px/22px weight 600.

### Data Tables
- **Header Row**: Surface `#F8FAFC`, border bottom `2px solid #D5DDE7`, height 48px. Text 15px bold `#475569`.
- **Body Rows**: Surface `#FFFFFF`, border bottom `1px solid #E2E8F0`, height 52px. Hover state `#F8FAFC`. Selected state `#EFF6FF`. Text 16px `#0F172A`. Tabular figures enabled on numbers.

### Status Indicators & Badges
- **Pattern**: Every badge must combine a solid dot or semantic icon + localized Korean string (`정상 가동`, `점검 주의`, `장애 발생`, `데이터 수신 중`).
- **Success Badge**: Surface `#F0FDF4`, border `#BBF7D0`, text `#166534`.
- **Warning Badge**: Surface `#FFFBEB`, border `#FDE68A`, text `#92400E`.
- **Error Badge**: Surface `#FEF2F2`, border `#FECACA`, text `#B91C1C`.
- **Info Badge**: Surface `#EFF6FF`, border `#BFDBFE`, text `#1E40AF`.