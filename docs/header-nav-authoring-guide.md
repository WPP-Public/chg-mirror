# Header Nav — Authoring Guide

> **Audience:** Content authors
> **Block:** `nav`
> **Source document:** `/nav` (per site/language, e.g. `/global/en/nav`)

---

## 1. Overview

Site navigation is authored with the **Nav** component in the Universal Editor, placed
once on the `/nav` fragment page for each site/language. Unlike a generic content page,
you build the menu entirely from structured fields and nested components — no manual
list/markup editing is required or possible.

## 2. Component Tree

Add exactly one **Nav** component to the `/nav` page, then build its children:

```
Nav
 ├─ Logo Image, Logo Alt Text
 ├─ Book Button Label, Book Button Link
 ├─ Nav Language (add one per language)
 │    ├─ Language Label       e.g. "English"
 │    ├─ Short Label          e.g. "EN" (shown as the collapsed switcher label)
 │    └─ Link
 └─ Nav Category (add one per top-level menu item)
      ├─ Category Label
      ├─ Direct Link          (only fill in if this category has NO Nav Region children —
      │                        makes it a plain link with no expandable content)
      ├─ Promo Image / Alt Text
      ├─ Promo CTA Label / Link
      └─ Nav Region (optional — add one or more to group links, e.g. "ASIA PACIFIC")
           ├─ Region Label     (optional — leave blank for an unlabeled group)
           └─ Nav Link (add one per destination/link)
                ├─ Link Label
                ├─ Link
                └─ Note         (optional, e.g. "(2026)")
```

Add/remove/reorder items using the "+" control at the level you want to change — a new
category, a new region inside a category, or a new link inside a region.

## 3. Rules

- **Order does not matter.** Nav Language and Nav Category items are recognized by type,
  not by their position in the tree — you can freely reorder categories or languages.
- **A category with no Nav Region children is a plain link.** Fill in its "Direct Link"
  field; it renders in the menu rail without expandable content.
- **A category with one or more Nav Region children is expandable.** Its regions render as
  labeled groups of links in the menu; leave a region's "Region Label" blank for an
  unlabeled group of links.
- **Promo fields are optional per category.** Leave them blank to hide the promo
  image/CTA for that category.
- Every Nav Link needs both a Link Label and a Link — links without both are skipped.

## 4. Pre-publish Checklist

- [ ] At least one Nav Language exists (used for the language switcher)
- [ ] At least one Nav Category exists
- [ ] Each category is either: (a) a Direct Link, or (b) has ≥1 Nav Region with ≥1 Nav
      Link each
- [ ] Logo Image and Book Button fields are filled in on the Nav component itself
