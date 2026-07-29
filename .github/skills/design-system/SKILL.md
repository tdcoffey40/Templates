---
name: design-system
description: >
  Comprehensive guide for building components in this pure HTML/CSS/JS design
  system. Use when: adding or editing components, using design tokens, writing
  component CSS, running the linter, generating a custom theme, fixing
  specificity, authoring animations, or checking accessibility. Covers all
  token categories, native-HTML patterns, CSS rules, JS guidelines, the linter
  (scripts/lint.js) and the theme configurator (config.html).
---

# Design System Skill

## Core Principles

1. **CSS over JS** — If it can be done in CSS, do it in CSS. JS is only for
   things CSS genuinely cannot handle (`showModal()`, `transitionend` callbacks,
   dynamic data binding).
2. **Native HTML first** — Prefer elements with built-in browser semantics and
   accessibility (`<details>`, `<dialog>`, `<label>`, `<button>`, etc.) over
   custom ARIA constructs.
3. **Token-first** — Every color, size, font, spacing, radius, shadow, duration,
   and easing value comes from `styles/variables.css`. Never hardcode a value
   that has a token.
4. **No `!important`** — Fix specificity conflicts by adjusting selectors (add
   `:not()` exclusions, combine class selectors, reorder rules). Forcing with
   `!important` is never the answer.
5. **No abstractions for one-offs** — Don't create helpers or utility classes
   unless they are used in three or more places.

---

## File Structure

```
/
├── index.html              # Master preview — sidebar nav + iframe
├── config.html             # Theme configurator — generate palettes, download tokens
├── styles/
│   ├── variables.css       # ALL design tokens (single source of truth)
│   └── framework.css       # CSS reset + layout / utility classes
├── components/             # One HTML file per component
│   └── *.html
├── scripts/
│   └── lint.js             # Design-system linter (Node, zero deps)
└── .github/
    ├── copilot-instructions.md
    └── skills/design-system/SKILL.md
```

---

## Every Component File Template

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ComponentName — Design System</title>
  <link rel="stylesheet" href="../styles/variables.css">
  <link rel="stylesheet" href="../styles/framework.css">
  <!-- Anti-FOUC: apply saved theme before first paint -->
  <script>(function(){try{var t=localStorage.getItem('ds-theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}}());</script>
  <style>/* component-scoped styles */</style>
</head>
<body>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Component Name</h1>
      <p class="page-description">One-sentence description.</p>
    </div>
    <!-- demo sections -->
  </div>
  <script>
    /* component JS */
    /* Theme bridge — ALWAYS last */
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'theme')
        document.documentElement.dataset.theme = e.data.value;
    });
  </script>
</body>
</html>
```

Both the **anti-FOUC script** and the **theme bridge listener** are required in
every component file. The linter will warn if either is missing.

---

## Token Reference

### Colors

```css
/* Brand */
var(--color-primary)          /* main accent */
var(--color-primary-hover)    /* :hover state */
var(--color-primary-active)   /* :active state */
var(--color-primary-subtle)   /* tinted background */
var(--color-primary-fg)       /* text/icon on primary bg */
var(--color-secondary)        /* secondary accent */
var(--color-secondary-hover)
var(--color-secondary-subtle)
var(--color-secondary-fg)

/* Surface */
var(--color-bg)               /* page background */
var(--color-surface)          /* card / panel */
var(--color-surface-raised)   /* elevated card */
var(--color-surface-overlay)  /* hover tint overlay */

/* Border */
var(--color-border)           /* default border */
var(--color-border-strong)    /* emphasized border */
var(--color-border-focus)     /* focus ring color */

/* Text */
var(--color-text)             /* primary text */
var(--color-text-muted)       /* secondary text */
var(--color-text-subtle)      /* placeholder / disabled */
var(--color-text-inverse)     /* text on dark backgrounds */

/* Semantic */
var(--color-success)          var(--color-success-subtle)   var(--color-success-fg)
var(--color-warning)          var(--color-warning-subtle)   var(--color-warning-fg)
var(--color-error)            var(--color-error-subtle)     var(--color-error-fg)
var(--color-info)             var(--color-info-subtle)      var(--color-info-fg)
```

All semantic tokens flip automatically in dark mode via
`[data-theme="dark"]` in `variables.css`. Never use
`@media (prefers-color-scheme)`.

### Spacing

Scale: `--space-{1–24}` = `0.25rem` steps. Also `--space-px` (1 px) and `--space-0`.

```css
--space-1: 0.25rem   --space-2: 0.5rem    --space-3: 0.75rem
--space-4: 1rem      --space-5: 1.25rem   --space-6: 1.5rem
--space-7: 1.75rem   --space-8: 2rem      --space-10: 2.5rem
--space-12: 3rem     --space-16: 4rem     --space-24: 6rem
```

Use `gap` for space between flex/grid children; `padding` for inset space;
`margin` only for external block spacing.

### Typography

```css
/* Families */
var(--font-sans)   /* system-ui → Inter → Roboto → … */
var(--font-mono)   /* SF Mono → Fira Code → Cascadia Code → … */

/* Size scale */
--text-xs: 0.75rem    --text-sm: 0.875rem   --text-base: 1rem
--text-lg: 1.125rem   --text-xl: 1.25rem    --text-2xl: 1.5rem
--text-3xl: 1.875rem  --text-4xl: 2.25rem   --text-5xl: 3rem

/* Weight */
--font-normal: 400   --font-medium: 500   --font-semibold: 600
--font-bold: 700     --font-extrabold: 800

/* Line-height */
--leading-tight: 1.25   --leading-normal: 1.5   --leading-relaxed: 1.625
```

### Border Radius

```css
--radius-sm: 0.125rem   --radius-base: 0.25rem  --radius-md: 0.375rem
--radius-lg: 0.5rem     --radius-xl: 0.75rem    --radius-2xl: 1rem
--radius-3xl: 1.5rem    --radius-full: 9999px
```

### Shadows

```css
--shadow-xs   --shadow-sm   --shadow-md   --shadow-lg   --shadow-xl
```

### Z-index

```css
--z-base: 0      --z-raised: 10     --z-dropdown: 100
--z-sticky: 200  --z-overlay: 300   --z-modal: 400
--z-toast: 500   --z-tooltip: 600
```

Use values `0` and `1` freely for local stacking context within a component.
Any value ≥ 2 that is not a `var(--z-*)` reference will be flagged by the
linter.

### Transitions & Duration

```css
--dur-75   --dur-100  --dur-150  --dur-200  --dur-300  --dur-500

--ease-linear   --ease-in   --ease-out   --ease-in-out

/* Shorthand */
--transition-colors     /* color + background-color + border-color, 150ms */
--transition-shadow     /* box-shadow, 150ms */
--transition-transform  /* transform, 200ms */
--transition-opacity    /* opacity, 150ms */
```

Duration guidance: `--dur-150` for micro (hover tint), `--dur-200` for
standard UI transitions, `--dur-300` for expand/collapse.

### Component Size Tokens

```css
--size-xs: 1.5rem   /* 24px — small icon button */
--size-sm: 2rem     /* 32px — compact input/button */
--size-md: 2.5rem   /* 40px — default input/button height */
--size-lg: 3rem     /* 48px — large button */
--size-xl: 3.5rem   /* 56px — hero/prominent control */
```

---

## CSS Guidelines

### Layout

```css
/* Grid for 2-D layouts */
display: grid;
grid-template-columns: 260px 1fr;

/* Flexbox for 1-D */
display: flex;
align-items: center;
gap: var(--space-3);          /* gap between siblings, not margins */

/* Always box-sizing border-box */
*, *::before, *::after { box-sizing: border-box; }

/* Prevent text overflow in flex children */
.flex-child { min-width: 0; }
```

### Sizing

```css
/* rem for font-size and spacing */
font-size: var(--text-sm);
padding: var(--space-4);

/* px only for borders, outlines, box-shadows */
border: 1px solid var(--color-border);
box-shadow: 0 0 0 3px rgb(0 0 0 / 0.1);
```

### Selectors & Specificity

```css
/* Low specificity — classes only */
.btn { }
.btn-primary { }

/* State via data attributes or ARIA */
[data-theme="dark"] .btn { }
.btn[aria-disabled="true"] { }

/* Use :not() to exclude states from generic rules rather than !important */
.item:hover:not(.item--selected):not(.item--active) { background: var(--color-surface-overlay); }

/* Raise specificity to match a conflicting rule by adding a shared selector */
/* e.g. position rule: [data-tooltip]:not([data-pos])::after  — specificity (0,2,1) */
/* color variant:     [data-tooltip][data-tooltip-color="X"]::after — also (0,2,1) */
/* cascade order then resolves the conflict with no !important needed */

/* Avoid !important, ID selectors for styling, deeply nested (3+ level) selectors */
```

### Dark Mode

```css
/* Use semantic tokens — they flip automatically */
background: var(--color-surface);   /* #fff in light, --slate-800 in dark */

/* NEVER use prefers-color-scheme — the system uses data-theme */
```

---

## Native HTML Patterns

### Accordion — `<details>/<summary>` + CSS grid trick

```html
<details class="accordion-item">
  <summary class="accordion-trigger">
    Title
    <svg class="accordion-icon">…</svg>
  </summary>
  <div class="accordion-content">
    <div class="accordion-body">Content</div>
  </div>
</details>
```

```css
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--dur-300) var(--ease-in-out);
}
details[open]:not(.closing) > .accordion-content { grid-template-rows: 1fr; }
.accordion-body { overflow: hidden; }
```

JS close animation: add `.closing` → CSS animates to `0fr` →
`transitionend` removes `[open]` and `.closing`.

### Dropdown — `<details>` with managed close

```html
<details class="dropdown">
  <summary class="dropdown-trigger">Label</summary>
  <div class="dropdown-menu">…</div>
</details>
```

```javascript
summary.addEventListener('click', e => {
  e.preventDefault();
  dd.open ? animateClose() : dd.setAttribute('open', '');
});
document.addEventListener('click', e => {
  if (dd.open && !dd.contains(e.target)) animateClose();
});
```

Never rely on the browser's native `<details>` close for animated exits —
the element disappears before the animation can run.

### Dialog — native `<dialog>` + `@starting-style`

```html
<dialog id="my-dialog" class="dialog-md">
  <button class="dialog-close" aria-label="Close"
          onclick="this.closest('dialog').close()">…</button>
  …
</dialog>
<button onclick="document.getElementById('my-dialog').showModal()">Open</button>
```

```css
dialog {
  opacity: 1; transform: scale(1) translateY(0);
  transition: opacity var(--dur-200) var(--ease-out),
              transform var(--dur-200) var(--ease-out),
              display var(--dur-200) allow-discrete,
              overlay var(--dur-200) allow-discrete;
}
dialog:not([open]) { display: none; opacity: 0; transform: scale(0.96) translateY(8px); }
@starting-style {
  dialog[open]           { opacity: 0; transform: scale(0.96) translateY(8px); }
  dialog[open]::backdrop { opacity: 0; }
}
```

### Switch — CSS-only via hidden checkbox

```html
<label class="switch">
  <input type="checkbox" class="switch-input">
  <span class="switch-track"><span class="switch-thumb"></span></span>
</label>
```

```css
.switch-input { position: absolute; opacity: 0; width: 0; height: 0; }
.switch-input:checked + .switch-track { background: var(--color-primary); }
.switch-input:checked + .switch-track .switch-thumb { transform: translateX(…); }
.switch-input:focus-visible + .switch-track {
  outline: 2px solid var(--color-border-focus); outline-offset: 2px;
}
```

### Tooltip — CSS-only via data attribute

```html
<button data-tooltip="Save changes" data-tooltip-pos="top">…</button>
```

```css
[data-tooltip]::before { content: attr(data-tooltip); /* position, style */ }
[data-tooltip]::after  { /* arrow */ }
[data-tooltip]:hover::before,
[data-tooltip]:hover::after { opacity: 1; transform: …; }
```

---

## JavaScript Guidelines

```javascript
// Event delegation — attach once on container, not on each child
container.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
});

// One-time listeners
el.addEventListener('transitionend', handler, { once: true });

// dataset over getAttribute
el.dataset.value       // ✅
el.getAttribute('data-value')  // ✗

// DOM state via CSS classes / attributes, not inline styles
el.classList.add('is-open');                  // ✅
el.style.display = 'none';                    // ✗ (only when truly dynamic)

// Animation timing — CSS + transitionend, never setTimeout
el.classList.add('closing');
el.addEventListener('transitionend', () => el.removeAttribute('open'), { once: true });

// Never: eval(), document.write(), setInterval for animation
```

---

## Accessibility Checklist

- `<button>` with icon-only content → `aria-label` required
- `<img>` → `alt` attribute required (empty string for decorative)
- Interactive custom elements → `role`, `aria-expanded`, `aria-controls`
- Every form `<input>` → paired `<label>` or `aria-label` / `aria-labelledby`
- Focus rings: `outline: 2px solid var(--color-border-focus); outline-offset: 2px`
  Never remove focus styles without a replacement
- Color is never the sole differentiator (pair with text or icon)
- Pagination, prev/next icon buttons → `aria-label="Previous page"` etc.
- Dialog close buttons → `aria-label="Close"`

---

## Animation Checklist

| Scenario | Pattern |
|---|---|
| Overlay / modal enter | `@starting-style` → CSS `opacity` + `transform` + `allow-discrete` |
| Overlay exit | `transition: … allow-discrete` on `:not([open])` rule |
| Expand / collapse | `grid-template-rows: 0fr → 1fr` |
| Fade-up enter | `opacity: 0; translateY(8px)` → `opacity: 1; translateY(0)` |
| Animated exit | Add `.closing` class → `transitionend` → remove element/attribute |

Duration: `--dur-150` hover, `--dur-200` standard, `--dur-300` expand.  
Easing: `--ease-out` enter, `--ease-in` exit, `--ease-in-out` toggle.

```css
/* Always include reduced-motion reset */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

---

## Linter — `scripts/lint.js`

Zero dependencies. Uses Node built-ins only.

### Running

```bash
# Lint entire workspace
node scripts/lint.js
# or
npm run lint

# Lint a single file
node scripts/lint.js components/button.html
```

**Exit codes:** `0` = clean or warnings only. `1` = at least one error.
Errors block; warnings advise.

### Rules

| ID | Severity | What it checks |
|---|---|---|
| `no-hardcoded-color` | warn | Hex color not from `var(--color-*)`. Skips `variables.css`, `config.html`, CSS var definition lines, and `#fff`/`#000`. In HTML files, only checks inside `<style>` blocks and `style="..."` attributes. |
| `no-important` | warn | `!important` usage. Skips `prefers-reduced-motion` blocks and text inside comments. Fix by adjusting specificity. |
| `no-hardcoded-font` | warn | `font-family` not using `var(--font-sans)` or `var(--font-mono)`. Skips `inherit`, `unset`, `initial`. |
| `no-timer-animation` | warn | `setTimeout` or `setInterval` — use CSS `transitionend` instead. |
| `no-eval` | **error** | `eval()` — security. |
| `no-document-write` | **error** | `document.write()` — security. |
| `img-alt` | **error** | `<img>` without `alt` attribute. |
| `button-aria-label` | warn | Icon-only `<button>` (SVG with no text) missing `aria-label` or `title`. |
| `no-hardcoded-z-index` | warn | `z-index` value ≥ 2 not using a `var(--z-*)` token. Values `0` and `1` are allowed for local stacking context. |
| `unknown-token` | warn | `var(--foo)` referencing a token not defined in `variables.css`. |
| `missing-theme-listener` | warn | Component file missing the `postMessage` theme bridge listener. |
| `missing-anti-fouc` | warn | Component file missing the `ds-theme` localStorage anti-FOUC script. |
| `no-prefers-color-scheme` | warn | `@media (prefers-color-scheme)` — use `[data-theme]` tokens instead. |

### Suppressing a line

```css
color: #custom; /* lint-ignore */
```

```html
<div style="background:#custom"><!-- lint-ignore --></div>
```

Adding `lint-ignore` anywhere on the line suppresses all rules for that line.
Use sparingly — prefer fixing the root cause.

---

## Theme Configurator — `config.html`

Open `config.html` directly in a browser (or via the "Config" link in `index.html`).

### What it does

1. **Pick three base colors** — Primary, Secondary, Neutral. A color picker and
   a hex text field are provided for each. The preview updates live.
2. **Generate full 50–900 scales** — HSL interpolation creates a 10-stop palette
   from a single "500" anchor color.
3. **Typography** — Separate fields for Headline and Body font families.
   Common font names are suggested via `<datalist>`. Fallbacks are inferred
   automatically (serif → Georgia stack, mono → Fira Code stack, sans → system
   stack).
4. **Radius & Spacing** — Presets (Default / Compact / Rounded) that scale all
   radius and spacing tokens proportionally.
5. **Download tokens** — Two formats:
   - **JSON (W3C DTCG)** — `$value` / `$type` properties, palette references
     like `{palette.primary.500}`. Import into Tokens Studio / Style Dictionary.
   - **CSS** — Drop-in replacement for `styles/variables.css`, complete with
     dark-mode overrides.

### Typical workflow

```
1. Open config.html in a browser.
2. Adjust Primary color (e.g. enter #0ea5e9 for sky blue).
3. Adjust Secondary and Neutral.
4. Choose headline / body fonts.
5. Click "Download CSS" → replace styles/variables.css.
6. Click "Download JSON" → commit as design-tokens.json for tooling.
7. Run node scripts/lint.js — the new tokens are auto-discovered.
```

The configurator itself is exempt from the `no-hardcoded-color` linter rule
because it builds color values programmatically.

---

## Common Mistakes & How to Fix Them

| Mistake | Fix |
|---|---|
| Hover style overrides selected/active state | Add `:not(.selected)` / `:not(.active)` to the hover rule |
| Color variant specificity lower than position/base rule | Prepend a shared attribute selector to raise to the same level; cascade order handles the rest |
| `!important` used to win a specificity war | Identify which rule is winning, then either raise the weaker rule's specificity or add a `:not()` exclusion to the stronger rule |
| Hardcoded hex in a component | Replace with the nearest semantic `var(--color-*)` token; if none fits, consider adding a palette entry to `variables.css` |
| `setTimeout` for animation delay | Use `transitionend` / `animationend` with `{ once: true }` |
| Missing `aria-label` on icon button | Add `aria-label="Describe action"` to the `<button>` element |
| `@media (prefers-color-scheme)` | Remove it; use `[data-theme="dark"]` token overrides instead |
| `font-family` hardcoded in component | Replace with `var(--font-sans)` or `var(--font-mono)` |
| z-index number ≥ 2 in component | Replace with the appropriate `var(--z-*)` token |
