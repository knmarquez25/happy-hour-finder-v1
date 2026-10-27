import { escapeHtml as esc } from "./ui-state.js";

// A placeholder is always available underneath a venue-specific photograph.
// Photography does not establish anything about a venue's offers or review status.
export function renderVenuePhoto(name, media) {
  const usable =
    media &&
    [media.url, media.sourceUrl].every((value) => {
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    });
  const tone = [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 3;
  return `<div class="venue-photo-slot"><div class="venue-placeholder tone-${tone}" role="img" aria-label="Photo not yet available for ${esc(name)}" ${usable ? "hidden" : ""}><span class="placeholder-monogram" aria-hidden="true">hh.</span><span class="placeholder-caption" aria-hidden="true">Photo coming soon</span></div>${usable ? `<a class="venue-photo" href="${esc(media.sourceUrl)}" target="_blank" rel="noreferrer"><img src="${esc(media.url)}" alt="${esc(media.alt)}" loading="lazy" decoding="async" width="112" height="140"><span>${esc(media.credit || "Photo: restaurant")} ↗</span></a>` : ""}</div>`;
}

export function handleVenuePhotoError(event) {
  if (!event.target.matches(".venue-photo img")) return;
  const link = event.target.closest(".venue-photo");
  const placeholder = link
    .closest(".venue-photo-slot")
    .querySelector(".venue-placeholder");
  link.remove();
  placeholder.hidden = false;
}
