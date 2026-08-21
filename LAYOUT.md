# Frontend Layout & Design Tokens

Reference implementation: [components/homesection.tsx](components/homesection.tsx). When a value here disagrees with another component, this doc wins — the differences are listed in §11.

Everything is Tailwind v4 utilities. Fonts and theme variables live in [app/globals.css](app/globals.css).

---

## 1. Borders

Borders are hairline and low-contrast. They separate, they never decorate.

| Purpose | Class | Where |
|---|---|---|
| Table header underline | `border-b border-gray-200/40` | thead row |
| Row separators | `divide-y divide-gray-200/30` on `<tbody>` | never per-row borders |
| Popover / card outline | `border border-gray-200` | date popovers, dropdowns |
| Input outline (rest) | `border border-zinc-400` | login, register, modals |
| Input outline (focus) | `focus:border-black` (auth) · `focus:border-[#6C5CE7]` (app modals) | — |
| Modal outline | `border border-slate-200` | create/edit modals |
| Badge outline | `border border-blue-100` / `border-emerald-100` | Created / Updated pills |
| Section divider | `border-b border-slate-100` | page headers |

Rules:
- Opacity suffixes (`/40`, `/30`) are deliberate — a solid `border-gray-200` reads too heavy on `#f4f4f6`.
- Never mix a border and a shadow on the same element unless it is a floating layer (popover, modal).
- Table cells get **no** vertical borders. Column separation comes from padding alone.

Most-used in the codebase: `border-slate-300` (60), `border-slate-200` (51), `border-zinc-400` (10), `border-gray-200` (8).

## 2. Shadows

Four levels, mapped to elevation. Nothing else.

| Level | Class | Use |
|---|---|---|
| 0 | *(none)* | table rows, cells, tab strip |
| 1 | `shadow-sm` | the page shell card, logo tiles, sidebar surfaces |
| 2 | `shadow-lg` | inline popovers (date detail, context menus) |
| 3 | `shadow-2xl` | portal modals over the dim layer |

Also in use: `shadow-xl` (8×) — treat as an alias of level 2/3 and prefer `shadow-lg` or `shadow-2xl`.

Special case — the **notched tab** in [homesection.tsx:124-125](components/homesection.tsx#L124-L125) uses `box-shadow` as a drawing tool, not elevation:

```
before:[box-shadow:3px_3px_0_0_#f4f4f6]   /* left notch  */
after:[box-shadow:-3px_3px_0_0_#f4f4f6]   /* right notch */
```

Two 14px pseudo-elements with an inverted corner radius, filled by a hard-edged shadow in the surface colour. Keep that colour in sync with the panel background or the notch shows a seam.

## 3. Radius

| Class | px | Use |
|---|---|---|
| `rounded` | 4 | tiny inline pills, swatches |
| `rounded-md` | 6 | sidebar icon chips |
| `rounded-lg` | 8 | inputs, icon buttons, list rows |
| `rounded-xl` | 12 | popovers, cards, logo tiles, primary buttons |
| `rounded-2xl` | 16 | modals, pagination buttons |
| `rounded-l-2xl` | 16 left only | the main content shell — right edge stays flush |
| `rounded-t-[18px]` | 18 top | active tab only |
| `rounded-full` | — | avatars, dots, status indicators |

Frequency: `rounded-xl` (73), `rounded-lg` (71), `rounded-full` (36), `rounded-2xl` (20), `rounded-md` (13).

The shell is `rounded-l-2xl` because it butts against the viewport edge — do not "fix" it to `rounded-2xl`.

## 4. Colors

### 4.1 Surfaces

| Token | Hex | Use |
|---|---|---|
| App canvas | `#D9D9D9` | page background behind the shell |
| Panel | `#f4f4f6` | main content shell, active tab fill |
| Card | `#FFFFFF` | sidebar, modals, popovers, inputs |
| Control | `#e3e3e5` | pagination buttons at rest |
| Control hover | `gray-300` | pagination + icon button hover |
| Row hover | `gray-200/40` | table row hover |
| Icon-button hover | `gray-300/50` | the `⋮` action button |

### 4.2 Brand

| Token | Hex | Use |
|---|---|---|
| **Coral** (primary) | `#FF7675` | tab strip, primary buttons, active accents, auth panel |
| Coral hover | `#FF5F5E` | primary button hover |
| Violet | `#6C5CE7` | Apps nav chip, modal focus ring, links |
| Teal | `#00B894` | Modules nav chip |
| Cyan | `#00CEC9` | wordmark gradient, unread dot |
| Ink | `#000000` | active pagination page, strong headings |

`#FF7F77` (tab strip) and `#FF6B6B` are near-duplicates of coral — see §11.

### 4.3 Text

| Role | Class | Notes |
|---|---|---|
| Primary | `text-slate-900` | workspace names, headings |
| Body | `text-slate-800` / `text-slate-700` | cells, IDs, dates |
| Muted | `text-gray-500` | pagination summary |
| Column header | `text-[#7c7c80]` | thead only |
| Placeholder / empty | `text-gray-400`, `text-zinc-400` | "No data available", zero counts |
| On coral | `text-white/90` → `hover:text-white` | inactive tab labels |
| On black | `text-white` | active pagination page |

### 4.4 Status accents

| State | Fill | Text | Border |
|---|---|---|---|
| Info / Created | `bg-blue-50` | `text-blue-600` | `border-blue-100` |
| Success / Updated | `bg-emerald-50` | `text-emerald-600` | `border-emerald-100` |
| Error (inline text) | — | `text-red-400` | — |
| Error (banner) | `bg-[#FF7675]/10` | `text-[#FF7675]` | `border-[#FF7675]/30` |
| Destructive banner | `bg-red-50/80` | `text-red-600` | `border-red-100` |

The 50/600/100 triple is the pattern for any new status pill.

### 4.5 Data palettes

Not UI chrome — these live in [data/data.js](data/data.js) and are assigned to entities:

- `PALETTE` — workspace/module avatar colours, picked by hashing the id (`colorFor()`)
- `COLLECTION_COLOR_PALETTE` — collection accent bars
- `STATUS_SWATCHES` — status-column label colours

Never hand-pick from these in a component; go through the hash helper or the user's stored choice.

## 5. Typography

Fonts are loaded in [app/layout.tsx](app/layout.tsx) and exposed as classes in `globals.css`.

| Class | Family | Use |
|---|---|---|
| `font-google-sans` | Google Sans | **the UI font** — tables, tabs, buttons, labels |
| `font-dmsans` | DM Sans | workspace/module detail pages |
| `font-jost` | Jost | the "X" in the wordmark |
| `font-oswald`, `font-istokweb` | — | one-off decorative use |

Two families are competing (`font-dmsans` 119 uses vs `font-google-sans` 66) — see §11.

| Size | Use |
|---|---|
| `text-3xl` / `text-2xl` | auth headlines |
| `text-lg` | panel titles |
| `text-sm` | **the default** — cells, buttons, labels (162 uses) |
| `text-xs` | popover bodies, helper text (100 uses) |
| `text-[11px]` / `text-[10px]` | metadata lines, badges |

Weights: `font-bold` for names, active tabs and pagination digits; `font-semibold` for headers and labels; `font-medium` for dates and secondary cells; `font-normal` only to *undo* boldness (e.g. a zero count).

## 6. Spacing

| Context | Padding |
|---|---|
| Table cell | `px-6 py-2` |
| Table header cell | `px-6 py-3` |
| Tab button | `px-6 py-2.5` |
| Content area | `px-4 pt-2 pb-2` |
| Pagination footer | `px-8 py-5` |
| Popover | `p-3` |
| Modal | `p-6` |
| Sidebar block | `px-5 pt-5` |

Gaps: `gap-2` (button rows, tabs), `gap-3` (header clusters), `gap-4` (logo + text). Vertical rhythm inside stacks: `space-y-3` / `space-y-4`.

Fixed dimensions worth knowing: sidebar `w-82`, tab strip `min-h-[52px]`, pagination button `w-10 h-10`, input height `h-11`, popover width `w-64`.

## 7. Component recipes

**Shell card** — the frame every page content sits in:
```
bg-[#f4f4f6] rounded-l-2xl overflow-hidden h-full flex flex-col shadow-sm
```

**Tab strip**:
```
bg-[#FF7F77] pt-2.5 px-6 flex items-end min-h-[52px] gap-2 select-none relative
```
Active tab is a `motion.div` with `layoutId="activeTabBackground"` and a spring (`stiffness: 450, damping: 35`) so the fill slides between tabs. Label sits at `relative z-10` above it.

**Table**:
```
table:  w-full border-collapse
thead:  text-left text-sm text-[#7c7c80] font-bold border-b border-gray-200/40
tbody:  divide-y divide-gray-200/30
row:    hover:bg-gray-200/40 transition cursor-pointer text-slate-800
```

**Popover** (anchored, inside a `relative` cell):
```
absolute left-6 top-12 z-20 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3
text-xs text-gray-700 animate-in fade-in zoom-in-95 duration-100
```

**Icon button**:
```
p-1.5 rounded-lg hover:bg-gray-300/50 transition cursor-pointer text-slate-600
```
Icon sized `w-5 h-5`.

**Pagination button**:
```
rest:     w-10 h-10 rounded-2xl bg-[#e3e3e5] text-slate-800 hover:bg-gray-300
active:   bg-black text-white
disabled: disabled:opacity-40
```

**Primary button**:
```
w-full rounded-lg bg-[#FF7675] py-3 text-sm font-semibold hover:bg-[#ff5f5e]
disabled:bg-slate-400 disabled:cursor-not-allowed
```

**Secondary button**: `bg-slate-100 hover:bg-slate-200/70 text-zinc-600 rounded-xl px-4 py-2`

**Empty state**: `text-center py-20 text-gray-400` — full `colSpan` inside a table.

**Error state**: `text-center py-20 text-red-400 text-sm font-medium`

**Loading**: [CollectionLoader](components/CollectionLoader.tsx) inside a panel, [WorkspaceLoader](components/WorkspaceLoader.tsx) for a whole page. Skeleton bars are `bg-gray-200/70` + `animate-pulse`, staggered with inline `animationDelay`. The legacy `.shimmer` class in `globals.css` is tuned for dark surfaces and reads as invisible on `#f4f4f6` — prefer `animate-pulse`.

## 8. Interaction

- Always pair a colour change with `transition` (or `transition-colors duration-200` for tabs).
- Every clickable non-button element needs `cursor-pointer`.
- Disabled = `disabled:opacity-40` (controls) or `disabled:bg-slate-400 disabled:cursor-not-allowed` (primary buttons). Never only remove the handler.
- Popovers close on a container-level `onClick` that nulls the open-id state; the popover itself calls `e.stopPropagation()`, and its trigger does too.
- Only one popover open at a time — opening a date popover nulls the row menu, and vice versa.
- Row click navigates; anything interactive inside a row must `e.stopPropagation()`.

## 9. Z-index

| Layer | Value |
|---|---|
| Tab fill behind label | `z-0` |
| Tab label | `z-10` |
| Cell containing an open popover | `relative z-1` |
| Popover / dropdown | `z-20` |
| Sticky page header | `z-20` |
| Portal modal + backdrop | `z-50` |
| Drag ghost (inline style) | `999999` |

Backdrop: `fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4`, rendered through `createPortal(..., document.body)`.

## 10. Theming

`globals.css` defines a full token contract on `:root`/`.light`, `.dark`, `.blue`, `.green`, `.purple`. The class lands on `<html>` through `next-themes` ([theme.provider.tsx](app/providers/theme.provider.tsx)), which is given the theme list from `themes` in [data/data.js](data/data.js), so **a theme change applies to every route**, not just the one that rendered the picker.

Two layers do the work:

1. **Semantic tokens** — `--canvas`, `--panel`, `--card`, `--control`, `--control-hover`, `--foreground`, `--body`, `--muted`, `--hairline`, `--accent`, `--accent-hover`, `--primary`. Exposed to Tailwind via `@theme inline`, so they are real utilities: `bg-canvas`, `bg-panel`, `bg-card`, `bg-control`, `text-foreground`, `text-body`, `text-muted`, `border-hairline`, `bg-accent`, `hover:bg-accent-hover`. Opacity suffixes work (`bg-accent/10`).
2. **Palette overrides** — Tailwind v4 compiles `text-slate-800` to `color: var(--color-slate-800)`, so each theme class redefines the neutral scales (`slate` / `gray` / `zinc`) and the status tints. Every pre-existing utility retargets itself; no per-component `dark:` variants are needed. In `.dark` the neutral scale is **inverted** — `slate-800` is a light pixel — which keeps existing pairs like `bg-slate-800 text-slate-200` legible.

`<body>` carries `bg-canvas text-body` ([layout.tsx](app/layout.tsx)), so a route that sets no background inherits the theme.

Rules:
- New surfaces use the token utility, never a hex. `bg-[#f4f4f6]` is now `bg-panel`.
- `text-white` / `bg-black` are deliberately **not** themed — they are on-accent ink and modal scrim, constant across themes.
- Adding a theme = one class in `globals.css` + one entry in `themes` in `data/data.js`. Nothing else.

## 11. Known inconsistencies

Audited across `app/` and `components/`; fix these before adding new surfaces.

1. ~~**Four coral variants**~~ — fixed. All four collapsed into `bg-accent` / `hover:bg-accent-hover` (§10). The tab strip and the primary button are now the same token, and it follows the selected theme.
2. **Two UI fonts**: `font-dmsans` (119) on workspace/module pages, `font-google-sans` (66) on the dashboard. Pick one for chrome.
3. **Three neutral scales**: `slate`, `zinc` and `gray` all appear in borders and text. `slate` dominates (111 border uses) — standardise on it.
4. **Dark colours on a light UI**: `#111727` and `#0D1B2A` appear in [workspace/[id]/page.tsx](app/workspace/[id]/page.tsx) empty states, left over from a dark design. They look wrong against `#D9D9D9`.
5. ~~**Theme variables unused**~~ — fixed; see §10. Still hardcoded and outside the token layer: the teal wordmark gradient ([Sidebar.tsx:116](components/Sidebar.tsx#L116)), the unread dot ([notifications.tsx:135](components/notifications.tsx#L135)), and the violet/teal nav chips — decide whether those follow `--primary` or stay brand-constant.
6. **`.shimmer` vs `animate-pulse`** — two skeleton systems; `.shimmer` only works on dark backgrounds.
7. **`shadow-xl` vs `shadow-2xl`** used interchangeably for modals.

## 12. Token layer (implemented)

`globals.css` ships the tokens below; §10 explains the two layers. Reference them instead of retyping hexes:

```css
:root, .light {
  --canvas:  #d9d9d9;   /* page background behind the shell */
  --panel:   #f4f4f6;   /* content shell, active tab fill   */
  --card:    #ffffff;   /* sidebar, modals, popovers        */
  --control: #e3e3e5;   /* pagination buttons at rest       */

  --foreground: #0f172a;  --body: #1e293b;  --muted: #7c7c80;  --hairline: #e2e8f0;
  --accent: #ff7675;      --accent-hover: #ff5f5e;             --primary: #00cec9;
}
```

So `bg-[#f4f4f6]` is `bg-panel`, `bg-[#FF7F77]` is `bg-accent`, `text-[#7c7c80]` is `text-muted`, and the notch shadow reads `[box-shadow:3px_3px_0_0_var(--panel)]`.
