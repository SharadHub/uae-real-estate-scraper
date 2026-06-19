import { BASE_URL } from "./config.js";

const CATEGORY_BUY = 1;
const STUDIO_TYPE = 5;

const PROPERTY_TYPES = [1, 35, 22, 20, 42, 24, 18, 29, 10, 5, 30, 31, 45];
const BEDROOMS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const BATHROOMS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const PRICE_RANGES = [
  { min: 10000, max: 30000 },
  { min: 30000, max: 50000 },
  { min: 50000, max: 70000 },
  { min: 70000, max: 90000 },
  { min: 90000, max: 110000 },
];

type ListRequest = { url: string; label: string; userData: { page: number } };

export function generateInitialUrls(): ListRequest[] {
  const requests: ListRequest[] = [];

  for (const type of PROPERTY_TYPES) {
    for (const bed of BEDROOMS) {
      for (const bath of BATHROOMS) {
        if ((bed === 0 || bed === 1) && bath > 3) continue;
        if (type === STUDIO_TYPE && (bed > 0 || bath > 0)) continue;

        for (const { min, max } of PRICE_RANGES) {
          const url =
            `${BASE_URL}/en/search?` +
            `c=${CATEGORY_BUY}&t=${type}&bdr[]=${bed}&btr[]=${bath}` +
            `&pf=${min}&pt=${max}&fu=0&rp=y&ob=mr`;

          requests.push({ url, label: "LIST", userData: { page: 1 } });
        }
      }
    }
  }

  return requests;
}
