# Design System — AI Coding Instructions

This is a **pure HTML/CSS/JS** component design system. No build tools, no npm packages, no frameworks. Everything runs directly in the browser.

---

## Core Philosophy

1. **CSS over JS** — If it can be done in CSS, do it in CSS. JS is for behavior that CSS genuinely cannot handle (e.g., `showModal()`, `transitionend` callbacks, dynamic data).
2. **Native HTML** — Prefer elements with built-in browser semantics and accessibility over custom implementations.
3. **Token-first** — Every color, size, font, spacing value, and radius comes from `styles/variables.css`. Never hardcode values.
4. **No abstractions for one-off things** — Don't create helper functions or utility classes unless they're used in 3+ places.

---

## File Structure

```
/
├── index.html              # Master preview (sidebar + iframe)
├── config.html             # Theme configurator (color gen + download)
├── styles/
│   ├── variables.css       # ALL design tokens (single source of truth)
│   └── framework.css       # CSS reset + utility classes
├── components/             # One HTML file per component
│   ├── button.html
│   ├── dialog.html
│   └── ...
└── scripts/
    └── lint.js             # Design system linter
```

---

## Every Component File Must

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
  <style>/* component-scoped styles here */</style>
</head>
<body>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Component Name</h1>
      <p class="page-description">Brief description.</p>
    </div>
    <!-- sections -->
  </div>
  <!-- JS at bottom; theme bridge always last -->
  <script>
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'theme') document.documentElement.dataset.theme = e.data.value;
    });
  </script>
</body>
</html>
```

---

## Token Reference

### Colors
```css
/* Brand */
color: var(--color-primary);          /* main accent */
color: var(--color-primary-hover);    /* :hover state */
color: var(--color-primary-subtle);   /* tinted background */
color: var(--color-secondary);

/* Surface */
background: var(--color-bg);          /* page background */
background: var(--color-surface);     /* card/panel */
background: var(--color-surface-raised);
background: var(--color-surface-overlay); /* hover tint */

/* Border */
border-color: var(--color-border);
border-color: var(--color-border-strong);
outline-color: var(--color-border-focus); /* focus rings */

/* Text */
color: var(--color-text);
color: var(--color-text-muted);
color: var(--color-text-subtle);

/* Semantic */
color: var(--color-success);   background: var(--color-success-subtle);
color: var(--color-warning);   background: var(--color-warning-subtle);
color: var(--color-error);     background: var(--color-error-subtle);
color: var(--color-info);      background: var(--color-info-subtle);
```

### Spacing
```css
/* --space-1 = 0.25rem  …  --space-24 = 6rem */
padding: var(--space-4);          /* 1rem  */
gap:     var(--space-2);          /* 0.5rem */
margin:  var(--space-6);          /* 1.5rem */
```

### Typography
```css
font-family: var(--font-sans);
font-family: var(--font-mono);

font-size: var(--text-xs);    /* 0.75rem  */
font-size: var(--text-sm);    /* 0.875rem */
font-size: var(--text-base);  /* 1rem     */
font-size: var(--text-lg);    /* 1.125rem */
font-size: var(--text-xl);    /* 1.25rem  */
font-size: var(--text-2xl);   /* 1.5rem   */

font-weight: var(--font-normal);    /* 400 */
font-weight: var(--font-medium);    /* 500 */
font-weight: var(--font-semibold);  /* 600 */
font-weight: var(--font-bold);      /* 700 */

line-height: var(--leading-normal);
line-height: var(--leading-relaxed);
```

### Border Radius
```css
border-radius: var(--radius-sm);   /* 4px  */
border-radius: var(--radius-md);   /* 8px  */
border-radius: var(--radius-lg);   /* 10px */
border-radius: var(--radius-xl);   /* 12px */
border-radius: var(--radius-2xl);  /* 16px */
border-radius: var(--radius-full); /* 9999px */
```

### Shadows & Z-index
```css
box-shadow: var(--shadow-xs);
box-shadow: var(--shadow-sm);
box-shadow: var(--shadow-md);
box-shadow: var(--shadow-lg);
box-shadow: var(--shadow-xl);

z-index: var(--z-dropdown);   /* 100 */
z-index: var(--z-sticky);     /* 200 */
z-index: var(--z-modal);      /* 400 */
z-index: var(--z-tooltip);    /* 600 */
```

### Transitions
```css
transition: color var(--dur-150) var(--ease-out);
transition: background var(--dur-200) var(--ease-in-out);

/* Shorthand tokens */
transition: var(--transition-colors);   /* color + bg + border */
transition: var(--transition-shadow);
transition: var(--transition-transform);
```

---

## CSS Guidelines

### Layout
```css
/* ✅ Grid for 2-D, Flexbox for 1-D */
display: grid;
grid-template-columns: 260px 1fr;

display: flex;
align-items: center;
gap: var(--space-3);          /* ✅ gap, not margins between flex children */

/* ✅ Always box-sizing border-box */
*, *::before, *::after { box-sizing: border-box; }

/* ✅ Prevent flex overflow on text */
.flex-child { min-width: 0; }
```

### Sizing
```css
/* ✅ rem for font-size and spacing */
font-size: var(--text-sm);
padding: var(--space-4);

/* ✅ px only for borders, outlines, shadows */
border: 1px solid var(--color-border);
box-shadow: 0 0 0 3px rgb(0 0 0 / 0.1);

/* ✅ Use component size tokens */
height: var(--size-md);   /* buttons, inputs = 2.5rem */
```

### Selectors
```css
/* ✅ Low specificity — classes only */
.btn { }
.btn-primary { }

/* ✅ State via data attributes or aria */
[data-theme="dark"] .btn { }
.btn[aria-disabled="true"] { }
details[open] .icon { transform: rotate(180deg); }

/* ❌ Avoid !important */
/* ❌ Avoid ID selectors for styling */
/* ❌ Avoid deeply nested selectors (3+ levels) */
```

### Dark Mode
```css
/* ✅ Use semantic tokens — they auto-switch with [data-theme="dark"] */
background: var(--color-surface);   /* #fff in light, neutral-800 in dark */

/* ❌ Never use prefers-color-scheme — the system uses data-theme */
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
  <div class="accordion-content">   <!-- grid-template-rows: 0fr → 1fr -->
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

### Dropdown — `<details>` with managed JS close
```html
<details class="dropdown">
  <summary class="dropdown-trigger">Label</summary>
  <div class="dropdown-menu">…</div>
</details>
```
Always manage open/close with JS so the exit animation plays:
```javascript
summary.addEventListener('click', e => {
  e.preventDefault();
  dd.open ? animateClose() : dd.setAttribute('open', '');
});
document.addEventListener('click', e => {
  if (dd.open && !dd.contains(e.target)) animateClose();
});
```

### Dialog — native `<dialog>` + `@starting-style`
```html
<dialog id="my-dialog" class="dialog-md">…</dialog>
<button onclick="document.getElementById('my-dialog').showModal()">Open</button>
```
```css
dialog {
  opacity: 1;
  transform: scale(1) translateY(0);
  transition: opacity var(--dur-200) var(--ease-out),
              transform var(--dur-200) var(--ease-out),
              display var(--dur-200) allow-discrete,
              overlay var(--dur-200) allow-discrete;
}
dialog:not([open]) { display: none; opacity: 0; transform: scale(0.96) translateY(8px); }
@starting-style {
  dialog[open]          { opacity: 0; transform: scale(0.96) translateY(8px); }
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
.switch-input { position: absolute; opacity: 0; width: 0; }
.switch-input:checked + .switch-track { background: var(--color-primary); }
.switch-input:checked + .switch-track .switch-thumb { transform: translateX(…); }
```

### Tooltip — CSS-only via data attribute
```html
<button data-tooltip="Save changes" data-tooltip-pos="top">…</button>
```
```css
[data-tooltip]::before { content: attr(data-tooltip); … }
[data-tooltip]::after  { /* arrow */ }
[data-tooltip]:hover::before,
[data-tooltip]:hover::after { opacity: 1; }
```

---

## JavaScript Guidelines

```javascript
// ✅ Event delegation
container.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  // …
});

// ✅ One-time listeners
el.addEventListener('transitionend', handler, { once: true });

// ✅ dataset over getAttribute
btn.dataset.value   // ✅
btn.getAttribute('data-value')  // avoid

// ✅ requestAnimationFrame for layout reads/writes
requestAnimationFrame(() => { el.classList.add('visible'); });

// ❌ setTimeout for animations — use CSS + transitionend instead
// ❌ eval()
// ❌ document.write()
// ❌ Accessing DOM before DOMContentLoaded — put scripts at end of <body>
```

---

## Accessibility Checklist

- All `<button>` elements with icon-only content must have `aria-label`
- All `<img>` must have `alt` attribute
- Interactive custom elements need appropriate `role`, `aria-expanded`, `aria-controls`
- Focus rings: use `outline: 2px solid var(--color-border-focus); outline-offset: 2px`
- Don't remove focus styles without a replacement
- Use `<label>` for every form input (or `aria-label` / `aria-labelledby`)
- Color is never the only means of conveying information

---

## Animation Checklist

- Enter: `@starting-style` for overlays, `grid-template-rows: 0fr → 1fr` for expand, `opacity + translateY` for fade-up
- Exit: add `.closing` class → CSS transition → `transitionend` → remove element/attribute
- Duration: `var(--dur-150)` for micro (hover), `var(--dur-200)` for standard, `var(--dur-300)` for expand
- Easing: `var(--ease-out)` for enter, `var(--ease-in)` for exit, `var(--ease-in-out)` for toggle
- Always respect `prefers-reduced-motion` for users who need it:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
  }
  ```
