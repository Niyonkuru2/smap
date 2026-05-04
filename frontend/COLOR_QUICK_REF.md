# 🎨 Quick Color Reference

## The 3-Color System
```
🟢 EMERALD GREEN  #10B981  ← Primary (main brand, buttons, key actions)
⚫ BLACK          #000000  ← Secondary (alerts, secondary buttons, strong emphasis)
🔵 SKY BLUE       #3B82F6  ← Accent (info, links, trust)
```

## Tailwind Classes

### Primary (Emerald)
```html
<button class="bg-primary text-white">Primary Button</button>
<span class="text-primary">Primary Text</span>
<div class="border border-primary">Primary Border</div>
```

### Secondary (Black)
```html
<button class="bg-secondary text-white">Secondary Button</button>
<span class="text-secondary">Secondary Text</span>
<div class="border border-secondary">Secondary Border</div>
```

### Accent (Sky Blue)
```html
<button class="bg-accent text-white">Accent Button</button>
<span class="text-accent">Accent Text</span>
<div class="border border-accent">Accent Border</div>
```

## Hex Color Values

| Purpose | Color | Hex | RGB |
|---------|-------|-----|-----|
| Primary Light | 🟢 | #DCFCE7 | 220,252,231 |
| Primary Main | 🟢 | #10B981 | 16,185,129 |
| Primary Dark | 🟢 | #059669 | 5,150,105 |
| Secondary Light | ⚫ | #E5E5E5 | 229,229,229 |
| Secondary Main | ⚫ | #000000 | 0,0,0 |
| Secondary Dark | ⚫ | #1A1A1A | 26,26,26 |
| Accent Light | 🔵 | #DBEAFE | 219,234,254 |
| Accent Main | 🔵 | #3B82F6 | 59,130,246 |
| Accent Dark | 🔵 | #1F40AF | 31,64,175 |

## CSS Variables

```css
/* Available in any CSS */
background: hsl(var(--primary));           /* Emerald */
background: hsl(var(--secondary));         /* Black */
background: hsl(var(--accent));            /* Blue */

/* With opacity */
background: hsl(var(--primary) / 0.5);     /* 50% opacity */
color: hsl(var(--primary-foreground));     /* Foreground text */
```

## When to Use Each Color

### Use Emerald Green 🟢 for:
✅ Primary CTA buttons
✅ Logo/branding
✅ Main navigation
✅ Success states
✅ Positive feedback
✅ Key UI elements

### Use Black ⚫ for:
✅ Secondary buttons
✅ Strong emphasis
✅ Notifications
✅ High contrast elements
✅ Important notices
✅ Text & borders

### Use Sky Blue 🔵 for:
✅ Information sections
✅ Help/FAQ
✅ External links
✅ Analytics/data
✅ Status indicators
✅ Secondary info

## Don't Do This ❌

```html
<!-- ❌ Hardcoded colors -->
<button style="background: #10B981">Don't do this</button>

<!-- ❌ Random Tailwind colors -->
<button class="bg-green-500">Also wrong color</button>

<!-- ❌ Too many colors in one section -->
<div class="bg-primary border border-secondary text-accent">Too much!</div>
```

## Do This Instead ✅

```html
<!-- ✅ Use design system classes -->
<button class="bg-primary">Correct</button>

<!-- ✅ Up to 2 colors max per section -->
<div class="bg-primary text-primary-foreground">Better</div>

<!-- ✅ Use CSS variables in custom CSS -->
<style>
  .custom {
    color: hsl(var(--primary));
  }
</style>
```

## Dark Mode

Automatically works! Colors adjust through CSS variables:
```html
<!-- Light mode (default) -->
<div class="bg-primary text-white">Light</div>

<!-- Dark mode (automatic) -->
<!-- No changes needed - CSS variables handle it -->
<!-- Just use class="dark" on html element -->
```

## Email Template Colors

Hardcoded for email clients (they don't support CSS variables):
- Header: `linear-gradient(135deg, #10B981 0%, #059669 100%)`
- CTA: `linear-gradient(135deg, #1A1A1A 0%, #000000 100%)`
- Info: `linear-gradient(135deg, #DBEAFE 0%, #BBDEFB 100%)`
- Success: `linear-gradient(135deg, #DCFCE7 0%, #BBFBE1 100%)`
- Warning: `linear-gradient(135deg, #FEF3C7 0%, #FED7AA 100%)`

---

**Need more info?** See [COLOR_SYSTEM.md](./COLOR_SYSTEM.md)
