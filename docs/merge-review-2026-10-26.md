# Pre-merge review — October 26, 2026

Target: `main` at `0eb179ba88d89c7ad484af61260da9a5d0f39128`. Feature reviewed from `e3beac47884af028872a307a35ee2ca23b784eb6`.

The isolated integration preserves main's four commits removing the earlier project-write-up page/generation/navigation. The new app and previous-version footer keep that navigation removed; evaluation and submission drafts remain repository documents. Uncommitted work in the user's original checkout is excluded.

Two independent code reviews covered server security/owner access/source validation and discovery/filter/menu workflows. Review findings were reproduced with failing tests and fixed before merge:

- Discount amounts such as `Martini $2 off` no longer become full item prices. Generic Martini cannot borrow Espresso Martini's item evidence or price.
- Pending records paginate in 200-record pages with an explicit safety bound, rather than silently hiding older records after 200.
- Saved menu relevance is ranked before selecting at most four sources, so a requested venue/item after the first four remains eligible.
- Public-source policy rejections stop the import; nonstandard ports/private-address failures cannot fall through to the extraction provider.

Both reviewers rechecked their fixes and reported no remaining blocking findings within their review scope. These are agent code reviews, not independent restaurant verification.

Validation on the combined main+feature tree:

- 150/150 unit and HTTP tests pass.
- Dataset validation: 111 records, 111 geocoded, 84 primary-supported schedules, 44 with priced primary-source food and drink records.
- Discovery browser suite passes: initial browsing, AI fixture filtering, all recorded menu items, subtotal, Clear, failures/clarification, stale-response handling, four viewport widths.
- Review browser suite passes: public pending menus, evidence, owner approval snapshot and reload persistence, 390/320px layouts.
- New time-filter/menu-import browser flow passes at 1280px and 390px.
- Downey scope/refresh/Clear browser regression passes.
- Actual separate-origin HTTP/CORS browser transport passes with a fixture model response.
- Preserved legacy app browser suite passes, including six viewport widths and dark-mode keyboard/hover contrast.

Live provider integration is a separate, small acceptance check documented in `evaluation/day-time-filter-live.json`. The code-review fixes use deterministic provider fixtures; no owner approval or source publication is performed by the tests. Web recall remains incomplete, unknown prices/hours stay unverified, and ambiguous multi-clause schedules remain an unverified lead rather than proof of availability. Free service quotas and cold starts remain limitations.
