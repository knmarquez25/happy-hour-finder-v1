# Venue photography

Photos in `src/media.js` are display-only and do not affect matching or source confidence. Entries record the specific restaurant page, image URL, descriptive alt text, and review date for newly added photos. Existing entries retain their provenance. Photos are loaded from the operator’s published host, with a source/credit link.

On October 26, 2026, 87 existing primary-source pages were checked through the project’s robots-aware source collector. Candidate thumbnails were visually reviewed. Logos, maps, unrelated property photos, menu graphics, unclear branch associations, and unavailable images were excluded. Nineteen new venue-specific photos were accepted, expanding coverage from four to 23 of the 111 researched venues. The remaining 88 venues receive the branded placeholder. Photos may become unavailable later.

Every researched listing reserves the same arched photo slot. Missing or failed photos show “Photo coming soon” with a Happy Hour monogram. The replacement preserves the image area and does not imply that the placeholder depicts the restaurant.

Validation: `node tests/media-browser.cjs` against the running local app blocks images to check fallbacks, dimensions, menu access, and desktop/mobile overflow. Other discovery/review checks remain applicable.
