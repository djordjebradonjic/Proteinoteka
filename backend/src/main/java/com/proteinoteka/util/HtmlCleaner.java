package com.proteinoteka.util;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;

    public class HtmlCleaner {

        public static String cleanDescription(String rawHtml) {
            if (rawHtml == null || rawHtml.isEmpty()) return "";

            Safelist safelist = Safelist.none()
                    .addTags("b", "i", "strong", "ul", "li", "p", "br");

            String cleanHtml = Jsoup.clean(rawHtml, safelist);

            return cleanHtml
                    .replaceAll("(?m)^[ \t]*\r?\n", "")
                    .trim();
        }
}
