---
name: Zinc & Indigo
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fd'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1ec'
  on-surface: '#1a1b22'
  on-surface-variant: '#464555'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1effa'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#005339'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e4c'
  on-tertiary-container: '#72f2bb'
  error: '#EF4444'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#7afac2'
  tertiary-fixed-dim: '#5bdda7'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1ec'
  surface-zinc-50: '#FAFAFA'
  surface-zinc-100: '#F4F4F5'
  border-zinc-200: '#E4E4E7'
  sidebar-bg: '#09090B'
  success: '#10B981'
  warning: '#F59E0B'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  code-base:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '450'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  sidebar-width: 240px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

The design system is engineered for a professional, developer-centric URL management platform. It prioritizes efficiency, speed, and technical precision, drawing heavy influence from the refined "Zinc" aesthetic found in high-end SaaS tooling.

The visual style is **Modern Corporate Minimalism**. It utilizes a "light-mode-first" approach for the main content area to ensure high legibility of dense data, paired with a high-contrast dark sidebar to establish a strong structural hierarchy. The interface relies on subtle borders, deliberate whitespace, and a monochromatic foundation punctuated by a singular Indigo accent to guide user intent and highlight primary actions.

## Colors

The palette is centered around **Zinc** grays to create a neutral, sophisticated workspace.

- **Primary Indigo (#4F46E5):** Used exclusively for primary call-to-actions, active states, and focus indicators.
- **Surface & Backgrounds:** The main workspace uses Zinc-50 for backgrounds and White for cards. The sidebar uses a deep near-black (Zinc-950/Black) to provide a "pro" feel and clear architectural separation.
- **Functional Colors:** Success, Error, and Warning colors follow standard SaaS conventions but are slightly desaturated to maintain the professional tone.
- **Borders:** Use Zinc-200 for subtle division of elements without creating visual noise.

## Typography

The typography strategy differentiates between UI navigation and technical data.

- **Inter** is the workhorse for all interface labels, buttons, and body text. Its high x-height ensures legibility at small sizes (13px/14px).
- **JetBrains Mono** is utilized for all "data" strings, specifically short-links, destination URLs, and API keys. This provides a clear visual signal to the user that they are looking at technical parameters rather than prose.
- **Scale:** Headlines use tight tracking (-0.02em) to mimic a premium, editorial feel.
- **Mobile:** For screens below 768px, `headline-lg` should scale down to 24px to prevent excessive line-wrapping.

## Layout & Spacing

The layout employs a **Fixed Sidebar / Fluid Content** model for desktop.

- **Sidebar:** Positioned on the left, 240px width, utilizing a dark theme. It remains sticky while the main content area scrolls.
- **Main Canvas:** A 12-column grid with a maximum width of 1280px, centered on the screen.
- **Rhythm:** An 8px/4px base unit system is used for all padding and margins.
- **Mobile:** On devices < 768px, the sidebar transforms into a bottom-sheet or a hidden drawer, replaced by a 56px height top-bar containing the logo and a hamburger menu.

## Elevation & Depth

This design system uses **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows to denote hierarchy.

- **Level 0 (Background):** Zinc-50.
- **Level 1 (Cards/Surface):** White background with a 1px solid Zinc-200 border. This is the primary container for tables and forms.
- **Interactive Elevation:** Buttons and active input fields utilize a very subtle "micro-shadow" (0px 1px 2px rgba(0,0,0,0.05)) to suggest clickability without breaking the flat aesthetic.
- **Overlays:** Modals and dropdowns use a slightly larger blur (12px) with a 10% opacity black tint to separate from the main workspace.

## Shapes

The shape language is **Soft (0.25rem)**.

Standard components (Buttons, Inputs, Small Cards) use a 4px (0.25rem) radius to maintain a crisp, professional look. Larger containers or feature cards may use 8px (0.5rem) to soften the appearance, but the system generally avoids highly rounded or pill-shaped elements unless used for status badges (to distinguish them from interactive buttons).

## Components

- **Buttons:** Primary buttons are Solid Indigo with white text. Secondary buttons use a Zinc-100 ghost style with a subtle 1px border.
- **Input Fields:** Use 14px Inter text, Zinc-200 borders, and a 2px Indigo ring on focus. Use Monospace font for the URL prefix (e.g., "short.io/").
- **Tables:** Minimalist design with no vertical borders. Use 1px Zinc-100 horizontal dividers. Row hover states should use a subtle Zinc-50 tint.
- **Status Badges:**
  - _Active:_ Green tint background, dark green text.
  - _Expired/Disabled:_ Zinc-100 background, Zinc-600 text.
  - _Deleted/Error:_ Red tint background, dark red text.
- **Skeleton Loaders:** Use a subtle pulse animation on Zinc-100 blocks to represent loading data rows.
- **Cards:** White background, 1px Zinc-200 border, no shadow unless hovered (then apply a 4px soft shadow).
