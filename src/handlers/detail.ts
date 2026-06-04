import { Dataset } from "crawlee";
import type { CheerioCrawlingContext } from "crawlee";
import { BASE_URL } from "../config.js";

function extractImages($: CheerioCrawlingContext["$"]): string[] {
  try {
    const nextData = JSON.parse($("#__NEXT_DATA__").text());
    const raw: { full?: string }[] =
      nextData?.props?.pageProps?.propertyResult?.property?.images?.property ?? [];
    return raw.flatMap((img) => (img.full ? [img.full] : []));
  } catch {
    return [];
  }
}

export async function handleDetailPage({ $, request }: CheerioCrawlingContext) {
  const {
    listPrice,
    location,
    bedrooms: listBeds,
    bathrooms: listBaths,
    area: listArea,
  } = request.userData as Record<string, string>;

  const priceValue  = $('[data-testid="property-price-value"]').text().trim();
  const pricePeriod = $('[data-testid="property-price-period"]').text().trim();
  const price = priceValue
    ? `AED ${priceValue}${pricePeriod ? ` ${pricePeriod}` : ""}`
    : listPrice;

  const beds  = $('[data-testid="property-attributes-bedrooms"]').text().trim()  || listBeds;
  const baths = $('[data-testid="property-attributes-bathrooms"]').text().trim() || listBaths;

  const areaSizeEl = $('[data-testid="property-attributes-size"]');
  const area =
    areaSizeEl.find("span[title]").attr("title") ||
    areaSizeEl.find("span").last().text().trim()  ||
    listArea;

  const description =
    $('[data-testid="property-description-text"]').text().trim() ||
    $('[data-testid="description-text"]').text().trim()          ||
    $('[data-testid="property-description"]').text().trim();

  const amenities: string[] = [];
  $('[data-testid^="property-amenity"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) amenities.push(text);
  });

  const hasUpfrontCost     = $('[data-testid="upfront-cost-button"]').length > 0;
  const compareRentVsBuyHref = $('a[data-testid="link--tertiary"][href*="rent-vs-buy"]').attr("href");

  await Dataset.pushData({
    url: request.url,
    location,
    price,
    beds,
    baths,
    area,
    images: extractImages($),
    description,
    amenities,
    hasUpfrontCost,
    compareRentVsBuyUrl: compareRentVsBuyHref ? `${BASE_URL}${compareRentVsBuyHref}` : null,
  });
}
