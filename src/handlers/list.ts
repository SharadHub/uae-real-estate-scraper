import type { CheerioCrawlingContext } from "crawlee";
import { BASE_URL, MAX_PAGES } from "../config.js";

export async function handleListPage({ $, request, addRequests }: CheerioCrawlingContext) {
  const cards = $('article[data-testid="property-card"]');

  for (const card of cards.toArray()) {
    const price     = $(card).find('[data-testid="property-card-price"]').text().trim();
    const location  = $(card).find('[data-testid="property-card-location"]').text().trim();
    const bedrooms  = $(card).find('[data-testid="property-card-spec-bedroom"]').text().trim();
    const bathrooms = $(card).find('[data-testid="property-card-spec-bathroom"]').text().trim();
    const area      = $(card).find('[data-testid="property-card-spec-area"]').text().trim();
    const link      = $(card).find('a[data-testid="property-card-link"]').attr("href");

    if (!link) continue;

    await addRequests([{
      url: link.startsWith("http") ? link : `${BASE_URL}${link}`,
      label: "DETAIL",
      userData: { listPrice: price, location, bedrooms, bathrooms, area },
    }]);
  }

  const nextHref = $('a[data-testid="pagination-page-next-link"]').attr("href");
  const page = (request.userData.page as number) || 1;

  if (nextHref && page < MAX_PAGES) {
    await addRequests([{
      url: nextHref.startsWith("http") ? nextHref : `${BASE_URL}${nextHref}`,
      label: "LIST",
      userData: { page: page + 1 },
    }]);
  }
}
