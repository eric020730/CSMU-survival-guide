# CSMU Survival Guide design

## Purpose and source

A personal, continually updated notebook for work, shifts and everyday life. Keep the original categories, article hash URLs, Markdown sources and GitHub Pages publishing route. No invented experience, clinical guidance, sample dates or fake article counts.

Applied workflows: redesign-existing-projects, ui-ux-pro-max, minimalist-ui.
UI/UX search matched content-first archives and Minimalism & Swiss Style. Use that content hierarchy; newsletter forms, subscriber counts and social proof do not fit this notebook. Palette and Traditional Chinese typography follow minimalist-ui and the existing identity rather than the returned English academic font suggestions.

## Audit of the first release

- Desktop sidebar dominates an empty notebook and separates categories from search.
- Mobile interface and form inputs shrink to 12–14px.
- Editor dialog introduces a nested scroll region and pushes the publishing actions below the visible area.
- Optional fields receive the same prominence as title and body.
- Markdown cannot be previewed before publishing.
- Article navigation loses list scroll context and headings lack a reading outline.
- Drafts survive closing but export unnecessarily requires a complete publication-ready form.

## Visual system

Warm neutral paper, charcoal text and a restrained sage accent. No gradients, decorative photography, prominent shadows or infinite motion. Native Traditional Chinese sans-serif for UI and body, native Songti/serif for the personal-handbook headline. Body 16px minimum on phones, article text 17–18px, line height 1.85. Metadata no smaller than 12px. UI corners 6px, surfaces 10px. Controls at least 44px high.

Header: compact brand, help and one primary writing action. Archive: categories next to search, optional sorting, clear results, generous article rows. Empty state is useful and truthful. Editor: its own full page, required title/category/body first, date/summary/tags under an optional section, Markdown helpers, sanitized preview, local draft feedback and clear GitHub handoff. Reading: narrow text measure, heading outline on desktop and collapsible outline on mobile.

## Interaction and persistence

Keep `csmu-survival-guide-draft-v1` and migrate its content without clearing it. Keep new filename separately so reopening a draft uses the same GitHub file name. Store data only after successful localStorage writes; visibly report storage failures. Export incomplete drafts with `draft: true`. Publishing still requires a GitHub commit and successful Actions run. Never label a GitHub handoff as a completed publication.

Theme: system preference by default, optional light/dark selection. Motion is limited to short opacity/transform feedback and respects reduced motion. The mobile editor uses the main page scroll; publishing actions stay in document flow and include safe-area clearance.

## Verification

Check archive with no records, category/search/sorting with temporary local fixture data, Markdown preview sanitization, draft reload/reopening, incomplete export, required-field feedback, heading navigation, browser back and long titles/URLs. Fixtures never enter content sources or production. Inspect mobile/landscape/tablet/desktop layouts and both themes; verify Actions success and served version plus bytes against the final build.
