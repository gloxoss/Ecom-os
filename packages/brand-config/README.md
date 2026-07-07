# Brand Config

This package centralizes the visual identity for the Ecom-os platform.

## How to Re-Brand (Under 4 Hours)

Thanks to our unified design token architecture and Tailwind v4, you can completely re-brand the storefront without touching any UI component code. 

**Steps:**

1. **Update `brand.config.ts`**
   Open `apps/storefront/brand.config.ts` and replace the placeholder values with the new brand's information.
   - `colors`: Provide valid Hex codes for all 6 required semantic colors.
   - `fonts`: Update the font names (ensure they correspond to `next/font` definitions if using custom typography).
   - `logos`: Drop the new SVG/PNG logo files into the Storefront's `public` directory and update the paths.
   - `hero`: Update the landing page hero text and images.
   - `contact` & `social`: Update the footer and contact page details.

2. **Generate Tokens**
   Run the following command from the root of the workspace to validate your new config and compile the CSS variables:
   ```bash
   pnpm run build
   # (or let predev run it automatically when you boot up)
   ```

3. **Verify**
   Start your dev server (`pnpm --filter storefront dev`) and check the homepage.
   - All buttons, backgrounds, and text should reflect your new `primary`, `secondary`, and `accent` colors.
   - The hero text should reflect your updated copy.

4. **Deploy**
   That's it! Because Next.js automatically bundles the newly generated `brand.tokens.css`, you can just push your changes to `main` and Vercel will handle the rest.
