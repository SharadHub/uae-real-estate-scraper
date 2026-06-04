import { ProxyConfiguration } from "crawlee";

export const BASE_URL = "https://www.propertyfinder.ae";
export const MAX_PAGES = 50;

export const proxyConfiguration = new ProxyConfiguration({
  proxyUrls: [
    "http://38.154.203.95:8000",
    "http://198.105.121.200:8000",
    "http://64.137.96.74:8000",
    "http://209.127.138.10:8000",
    "http://38.154.185.97:8000",
    "http://84.247.60.125:8000",
    "http://142.111.67.146:8000",
    "http://191.96.254.138:8000",
    "http://31.58.9.4:8000",
    "http://104.239.107.47:8000",
  ],
});