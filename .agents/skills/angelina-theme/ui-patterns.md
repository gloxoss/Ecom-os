# UI Patterns: Angelina Paris

## 1. Interaction States
- **Hover on Buttons:** Slight opacity shifts or background color transitions (e.g., Transparent to Soft Peach, or Café to Gold). Avoid transforming scale to prevent layout thrashing.
- **Focus Rings:** Use Gold (`#c69951`) or Café (`#aa631a`) for focus outlines to maintain brand warmth. Avoid default browser blue focus rings.
- **Click Targets:** Generous padding (e.g., `17px 23px`) ensuring minimum 44x44px touch targets on mobile.

## 2. Component Templates

### Hero Section
- **Structure:** Center-aligned content, minimal typography hierarchy. Usually an H1 and an optional subtitle.
- **Typography:** Display text using `Pestifero-regular` up to 205px on desktop, scaling down on mobile (minimum 56px).
- **Background:** Either Pure White (`#ffffff`) or Old Peach (`#d9a594`) with no harsh borders. 

### Product/Cake Cards
- **Structure:** Image on top, title and details below.
- **Styling:** Gold background (`#c69951`), 12px padding all around. Highly visual, ensuring the product photography is the focus.
- **Elevation:** Warm mid-level shadow (`rgba(0, 0, 0, 0.11) 0px 2px 10px 0px`). No borders.

### Navigation
- **Structure:** Minimalist top bar, transparent background blending into the hero section, text links in Warm Brown (`#3f100a`).
- **Interaction:** Simple underline on hover or color shift to Café (`#aa631a`).

### Section Dividers
- **Structure:** Rely on substantial whitespace (`100px - 150px`) rather than hard horizontal lines to divide content sections.

## 3. Animation Philosophy
- **Micro-interactions:** Smooth, subtle color transitions (`150-300ms`) using Tailwind's `transition-colors`.
- **Entrance Animations:** Soft fade-ins and gentle vertical translations for headings (e.g., using Framer Motion). The animations should feel elegant and unhurried.
- **Reduced Motion:** Respect `prefers-reduced-motion` by falling back to simple opacity fades.

## 4. Implementation Guidelines (Tailwind CSS v4)
When building UI, prefer the custom tokens defined in `globals.css`:
- `text-foreground` instead of `text-slate-900`
- `font-heading` for H1/H2
- `bg-cafe` for primary actions
- `rounded-pill` for primary buttons

**Example Button:**
```tsx
<button className="bg-vieux-rose text-dark-brown font-bold text-xs py-[17px] px-[23px] rounded-pill hover:opacity-90 transition-opacity">
  Découvrir
</button>
```

**Example Card:**
```tsx
<div className="bg-gold p-3 shadow-[0_2px_10px_0_rgba(0,0,0,0.11)] rounded-[16px]">
  {/* Content */}
</div>
```
