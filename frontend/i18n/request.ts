import { getRequestConfig } from "next-intl/server";

const market = process.env.NEXT_PUBLIC_MARKET ?? "rs";
const localeMap: Record<string, string> = { rs: "sr", hr: "hr" };

export default getRequestConfig(async () => {
  const locale = localeMap[market] ?? "sr";
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
