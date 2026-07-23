# Angelina Asset Artifact Index

This folder now separates the Angelina image system into reusable documents. Use them in this order.

## 1. Reference Board

File: `ANGELINA_REFERENCE_IMAGE_LINKS.md`

Use this when choosing visual references for image generation. It contains official Angelina page links, direct image links where available, what each reference teaches, and how to use references safely.

## 2. Visual Style Guide

File: `ANGELINA_VISUAL_STYLE_GUIDE.md`

Use this to keep all generated images consistent with the current Angelina UI: white canvas, warm brown type, cafe/gold accents, vieux rose softness, rounded image containers, and elegant patisserie subject matter.

## 3. Replacement Map

File: `ANGELINA_ASSET_REPLACEMENT_MAP.md`

Use this to know every current Beano image/video slot in the website and what Angelina asset should replace it. This is the implementation checklist for later.

## 4. Prompt Library

File: `ANGELINA_PROMPT_LIBRARY.md`

Use this to generate the actual replacement images and videos. It includes final prompts, negative prompts, aspect ratios, filenames, and alt text.

## 5. Production Runbook

File: `ANGELINA_IMAGE_PRODUCTION_RUNBOOK.md`

Use this when creating, reviewing, exporting, naming, and later integrating the final assets into `public/assets/angelina/`.

## Existing Summary Artifact

File: `ANGELINA_ASSET_PROMPTS.md`

This is the broad strategic overview. The new documents split that thinking into practical operating files.

## V2 Old-Logic Correction

File: `ANGELINA_V2_BEANO_ASSET_LOGIC_AUDIT.md`

Use this to understand why the first generated hero and brew images did not fit the existing UI. It audits the old Beano image roles and translates them into Angelina requirements.

File: `ANGELINA_V2_OLD_LOGIC_PROMPTS.md`

Use this for the next generation pass. It asks for Angelina subject matter with the old asset logic: abstract full-bleed hero texture and isolated brew product cutouts.

## Source-Code Boundary

These artifacts are for planning and generation only. They do not change the website UI. When implementation happens later, update image/video `src`, `poster`, `alt`, and product asset data only unless a separate request asks for layout changes.
