#!/usr/bin/env node
'use strict';
/**
 * Design System Linter
 * Checks component HTML and CSS files for design system rule violations.
 *
 * Usage:
 *   node scripts/lint.js              # lint everything
 *   node scripts/lint.js components/button.html   # lint one file
 *
 * Exit code: 1 if any errors found, 0 otherwise.
 * Warnings do not affect exit code.
 *
 * Suppress a line: add  <!-- lint-ignore -->  or  // lint-ignore  at end of line.
 */

const fs   = require('fs');
const path = require('path');

// ── ANSI colours ─────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  blue:   '\x1b[34m',
};

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT       = path.join(__dirname, '..');
const VARS_CSS   = path.join(ROOT, 'styles', 'variables.css');
const COMPONENTS = path.join(ROOT, 'components');

// ── Known tokens (loaded from variables.css) ─────────────────────────────────
const KNOWN_TOKENS = new Set();

function loadKnownTokens() {
  if (!fs.existsSync(VARS_CSS)) return;
  const src = fs.readFileSync(VARS_CSS, 'utf8');
  for (const m of src.matchAll(/--([a-z][a-z0-9-]*)\s*:/g)) {
    KNOWN_TOKENS.add('--' + m[1]);
  }
}

// ── Result helpers ────────────────────────────────────────────────────────────
function issue(level, file, line, rule, msg) {
  return { level, file, line, rule, msg };
}
const err  = (f, l, r, m) => issue('error',   f, l, r, m);
const warn = (f, l, r, m) => issue('warning', f, l, r, m);

// ── Ignored-line check ────────────────────────────────────────────────────────
const IGNORE_COMMENT = /lint-ignore/;
function isIgnored(line) { return IGNORE_COMMENT.test(line); }

// ══════════════════════════════════════════════════════════════════════════════
// RULES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Warn on hardcoded hex color values that should be CSS variable references.
 * Skips: variables.css, config.html, lines that define a CSS variable,
 *        common pure-black/white shorthands, JS template literal placeholders.
 * For HTML files, only checks inside <style> blocks and style="..." attributes
 * so that hex values used as display text (e.g. colour swatches) are ignored.
 */
function ruleHardcodedColors(file, lines, out) {
  const base = path.basename(file);
  if (base === 'variables.css' || base === 'config.html') return;

  const SAFE = new Set(['#fff', '#ffffff', '#000', '#000000', '#FFF', '#FFFFFF']);
  const HEX_RE = /(^|[^"'`${\w])(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b/g;

  let inStyleBlock = false;

  lines.forEach((raw, i) => {
    if (isIgnored(raw)) return;

    if (file.endsWith('.html')) {
      // Track <style> block boundaries
      if (/<style[\s>]/.test(raw)) inStyleBlock = true;
      if (/<\/style>/.test(raw)) { inStyleBlock = false; return; }

      if (inStyleBlock) {
        // Inside <style>: use the same CSS rule logic
        if (/^\s*--[a-z][a-z0-9-]*\s*:/.test(raw)) return;
        for (const m of raw.matchAll(HEX_RE)) {
          const hex = m[2];
          if (SAFE.has(hex)) continue;
          out.push(warn(file, i + 1, 'no-hardcoded-color',
            `Hardcoded color ${hex} — use a var(--color-*) token`));
        }
      } else {
        // Outside <style>: only scan inline style="..." attribute values
        const inlineStyles = [...raw.matchAll(/style\s*=\s*"([^"]*)"/g)];
        for (const s of inlineStyles) {
          for (const m of s[1].matchAll(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}\b/g)) {
            const hex = m[0];
            if (SAFE.has(hex)) continue;
            out.push(warn(file, i + 1, 'no-hardcoded-color',
              `Hardcoded color ${hex} — use a var(--color-*) token`));
          }
        }
      }
      return;
    }

    // CSS files: original behaviour
    if (/^\s*--[a-z][a-z0-9-]*\s*:/.test(raw)) return;
    for (const m of raw.matchAll(HEX_RE)) {
      const hex = m[2];
      if (SAFE.has(hex)) continue;
      out.push(warn(file, i + 1, 'no-hardcoded-color',
        `Hardcoded color ${hex} — use a var(--color-*) token`));
    }
  });
}

/**
 * Error on !important — almost always avoidable via better specificity.
 * Excludes the prefers-reduced-motion reset block (which legitimately uses it).
 */
function ruleNoImportant(file, lines, out) {
  lines.forEach((raw, i) => {
    if (isIgnored(raw)) return;
    if (raw.includes('!important') && !raw.includes('prefers-reduced-motion')) {
      out.push(warn(file, i + 1, 'no-important',
        '!important — refactor specificity instead'));
    }
  });
}

/**
 * Warn on hardcoded font-family that bypasses design tokens.
 * Skips: the definition lines in variables.css, and 'inherit'/'unset'.
 */
function ruleHardcodedFont(file, lines, out) {
  if (path.basename(file) === 'variables.css') return;
  lines.forEach((raw, i) => {
    if (isIgnored(raw)) return;
    // Skip CSS custom property definition lines  (--font-xxx: ...)
    if (/--font-/.test(raw)) return;
    const m = raw.match(/font-family\s*:\s*(.+)/);
    if (!m) return;
    const value = m[1].trim();
    // Allow: var(...), inherit, unset, initial
    if (/^var\(|^inherit|^unset|^initial/.test(value)) return;
    out.push(warn(file, i + 1, 'no-hardcoded-font',
      'Hardcoded font-family — use var(--font-sans) or var(--font-mono)'));
  });
}

/**
 * Warn on setTimeout / setInterval — animation timing must use CSS.
 */
function ruleNoTimers(file, lines, out) {
  lines.forEach((raw, i) => {
    if (isIgnored(raw)) return;
    if (/\bsetTimeout\b/.test(raw) || /\bsetInterval\b/.test(raw)) {
      out.push(warn(file, i + 1, 'no-timer-animation',
        'setTimeout/setInterval — use CSS transitions + transitionend instead'));
    }
  });
}

/**
 * Error on eval() and document.write() — security and correctness.
 */
function ruleDangerousJS(file, lines, out) {
  lines.forEach((raw, i) => {
    if (isIgnored(raw)) return;
    if (/\beval\s*\(/.test(raw))
      out.push(err(file, i + 1, 'no-eval', 'eval() is forbidden'));
    if (/document\.write\s*\(/.test(raw))
      out.push(err(file, i + 1, 'no-document-write', 'document.write() is forbidden'));
  });
}

/**
 * Error on <img> without alt attribute.
 */
function ruleImgAlt(file, lines, out) {
  if (!file.endsWith('.html')) return;
  lines.forEach((raw, i) => {
    if (isIgnored(raw)) return;
    if (/<img\b/.test(raw) && !/\balt\s*=/.test(raw))
      out.push(err(file, i + 1, 'img-alt', '<img> missing alt attribute'));
  });
}

/**
 * Warn on icon-only <button> elements without aria-label or title.
 * Uses a negative lookahead inside the SVG content match to prevent the regex
 * from backtracking across </button> boundaries into neighboring buttons.
 */
function ruleButtonAriaLabel(file, content, out) {
  if (!file.endsWith('.html')) return;
  // Matches a button that:
  //   1. Has no aria-label or title attribute
  //   2. Contains exactly one SVG and nothing else (whitespace only)
  // The (?!<\/button>) guard stops the SVG content from spanning button boundaries.
  const re = /<button(?![^>]*\b(?:aria-label|title)\b)[^>]*>\s*<svg(?:(?!<\/button>)[\s\S])*?<\/svg>\s*<\/button>/g;
  for (const m of content.matchAll(re)) {
    const lineNum = content.slice(0, m.index).split('\n').length;
    const lineContent = content.split('\n')[lineNum - 1] || '';
    if (isIgnored(lineContent)) continue;
    out.push(warn(file, lineNum, 'button-aria-label',
      'Icon-only <button> missing aria-label'));
  }
}

/**
 * Warn on hardcoded z-index numbers outside of variables.css.
 * z-index values should use var(--z-dropdown/sticky/modal/tooltip).
 */
function ruleZIndex(file, lines, out) {
  const base = path.basename(file);
  if (base === 'variables.css' || base === 'framework.css') return;
  lines.forEach((raw, i) => {
    if (isIgnored(raw)) return;
    // z-index: 0 or 1 are common local stacking values; only flag ≥ 2
    const zm = raw.match(/z-index\s*:\s*(?!var\()(\d+)/);
    if (zm && parseInt(zm[1], 10) >= 2)
      out.push(warn(file, i + 1, 'no-hardcoded-z-index',
        'Hardcoded z-index — use var(--z-dropdown / --z-sticky / --z-modal / --z-tooltip)'));
  });
}

/**
 * Warn on var() calls referencing tokens not defined in variables.css.
 * Only checks tokens in the design system namespace (--color-*, --space-*, etc.).
 */
function ruleUnknownToken(file, lines, out) {
  if (KNOWN_TOKENS.size === 0) return;
  const NS = /^--(color|space|font|text|radius|shadow|dur|ease|size|z|leading|tracking)-/;
  lines.forEach((raw, i) => {
    if (isIgnored(raw)) return;
    for (const m of raw.matchAll(/var\((--[a-z][a-z0-9-]*)/g)) {
      const token = m[1];
      if (NS.test(token) && !KNOWN_TOKENS.has(token)) {
        out.push(warn(file, i + 1, 'unknown-token',
          `Unknown token ${token} — not defined in variables.css`));
      }
    }
  });
}

/**
 * Warn if a component file is missing the postMessage theme listener.
 * Only applies to files directly in components/.
 */
function ruleThemeListener(file, content, out) {
  if (!file.endsWith('.html')) return;
  if (!file.startsWith(COMPONENTS + path.sep)) return;
  if (!content.includes("'theme'") && !content.includes('"theme"')) {
    out.push(warn(file, 1, 'missing-theme-listener',
      "Component missing postMessage theme listener — add: window.addEventListener('message', ...)"));
  }
}

/**
 * Warn if a component file is missing the anti-FOUC theme script.
 */
function ruleAntiFlash(file, content, out) {
  if (!file.endsWith('.html')) return;
  if (!file.startsWith(COMPONENTS + path.sep)) return;
  if (!content.includes('ds-theme')) {
    out.push(warn(file, 1, 'missing-anti-fouc',
      "Component missing anti-FOUC script in <head> — add: localStorage.getItem('ds-theme')"));
  }
}

/**
 * Warn on prefers-color-scheme media queries — this system uses data-theme instead.
 */
function rulePrefersColorScheme(file, lines, out) {
  lines.forEach((raw, i) => {
    if (isIgnored(raw)) return;
    if (/prefers-color-scheme/.test(raw))
      out.push(warn(file, i + 1, 'no-prefers-color-scheme',
        'prefers-color-scheme detected — this system uses [data-theme] instead'));
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// FILE RUNNER
// ══════════════════════════════════════════════════════════════════════════════
function lintFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines   = content.split('\n');
  const out     = [];

  ruleHardcodedColors(file, lines, out);
  ruleNoImportant(file, lines, out);
  ruleHardcodedFont(file, lines, out);
  ruleNoTimers(file, lines, out);
  ruleDangerousJS(file, lines, out);
  ruleImgAlt(file, lines, out);
  ruleButtonAriaLabel(file, content, out);
  ruleZIndex(file, lines, out);
  ruleUnknownToken(file, lines, out);
  ruleThemeListener(file, content, out);
  ruleAntiFlash(file, content, out);
  rulePrefersColorScheme(file, lines, out);

  return out;
}

// ── Collect files ─────────────────────────────────────────────────────────────
function collectFiles(startDir, exts) {
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'scripts' || entry.name === 'node_modules') continue;
        walk(full);
      } else if (exts.includes(path.extname(entry.name))) {
        files.push(full);
      }
    }
  }
  walk(startDir);
  return files;
}

// ── Main ──────────────────────────────────────────────────────────────────────
loadKnownTokens();

// Allow passing explicit file paths as CLI arguments
const cliFiles = process.argv.slice(2).map(f => path.resolve(f));
const files = cliFiles.length > 0 ? cliFiles : collectFiles(ROOT, ['.html', '.css']);

const allIssues = [];
for (const file of files) {
  const issues = lintFile(file).map(r => ({
    ...r,
    file: path.relative(ROOT, file),
  }));
  allIssues.push(...issues);
}

// ── Report ────────────────────────────────────────────────────────────────────
// Group by file
const byFile = {};
for (const r of allIssues) {
  (byFile[r.file] = byFile[r.file] || []).push(r);
}

let errCount  = 0;
let warnCount = 0;

console.log('');
console.log(`${C.bold}${C.cyan}Design System Linter${C.reset}  ${C.dim}${files.length} file(s) scanned${C.reset}`);
console.log(`${C.dim}${'─'.repeat(60)}${C.reset}`);

if (Object.keys(byFile).length === 0) {
  console.log(`\n${C.green}${C.bold}✓ No issues found${C.reset}\n`);
} else {
  console.log('');
  for (const [file, issues] of Object.entries(byFile)) {
    console.log(`  ${C.bold}${file}${C.reset}`);
    // Sort by line number
    issues.sort((a, b) => a.line - b.line);
    for (const issue of issues) {
      const isErr = issue.level === 'error';
      const icon  = isErr ? `${C.red}✖${C.reset}` : `${C.yellow}⚠${C.reset}`;
      const lvl   = isErr ? `${C.red}error${C.reset}  ` : `${C.yellow}warn${C.reset}   `;
      const loc   = `${C.dim}${String(issue.line).padStart(4)}:1${C.reset}`;
      const rule  = `${C.dim}(${issue.rule})${C.reset}`;
      console.log(`    ${icon}  ${loc}  ${lvl}  ${issue.msg}  ${rule}`);
      if (isErr) errCount++;
      else warnCount++;
    }
    console.log('');
  }

  const summary = errCount > 0
    ? `${C.red}${C.bold}${errCount} error(s)${C.reset}`
    : `${C.green}${C.bold}0 errors${C.reset}`;
  const warnSummary = `${C.yellow}${warnCount} warning(s)${C.reset}`;
  console.log(`${C.dim}${'─'.repeat(60)}${C.reset}`);
  console.log(`  ${summary}  ${warnSummary}\n`);
}

process.exit(errCount > 0 ? 1 : 0);
