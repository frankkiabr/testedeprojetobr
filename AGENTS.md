<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep institutional sections in reusable components under src/components/frankkia and compose them at the index route; the home intentionally uses in-page navigation as requested.
- Keep the shared header, footer, skip link and single focusable main landmark in the root route around Outlet; leaf routes provide content only so keyboard navigation remains consistent across all pages.
- Keep commercial plan values and demonstration data in src/lib/frankkia-data.ts so presentation and tests share the same source of truth.
- Login and legal routes are presentational only; do not introduce authentication, storage or submission without a new explicit request.
- Define Frankkia visual styles and semantic color tokens in src/styles.css; reuse the existing Button and Accordion controls.
- Use presentation-only tool-type attributes and explicit CSS grid areas for the tools Bento; retain source-data order and existing card nodes so the asymmetric layout cannot be flattened by auto-placement and responsive reading order and scroll animation targets remain consistent.
- Keep navigation feedback in the shared Header with frame-throttled section tracking; animate the absolute mobile menu through CSS while hidden menus remain inert, so layout and keyboard access stay stable.
- Keep home scroll motion in a browser-only effect with a shared IntersectionObserver and finite CSS animations; animate only observed elements and leave default content visible so missing scripts or reduced motion never conceal content.
