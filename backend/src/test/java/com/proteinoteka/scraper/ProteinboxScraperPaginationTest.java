package com.proteinoteka.scraper;

import com.proteinoteka.service.ProteinboxScraper;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ProteinboxScraperPaginationTest {

    private final ProteinboxScraper scraper = new ProteinboxScraper(null, null, null, null);

    private static String nav(int current, int total) {
        StringBuilder sb = new StringBuilder("<nav class=\"woocommerce-pagination\"><ul class=\"page-numbers\">");
        for (int i = 1; i <= total; i++) {
            sb.append(i == current
                    ? "<li><span aria-current=\"page\" class=\"page-numbers current\">" + i + "</span></li>"
                    : "<li><a class=\"page-numbers\" href=\"/c/proteini/page/" + i + "/\">" + i + "</a></li>");
        }
        return sb.append("</ul></nav>").toString();
    }

    @Test
    void hasNextPageOnFirstAndMiddlePagesWithoutNextLink() {
        assertTrue(scraper.hasNextPage(Jsoup.parse(nav(1, 5))));
        assertTrue(scraper.hasNextPage(Jsoup.parse(nav(3, 5))));
    }

    @Test
    void noNextPageOnLastPage() {
        assertFalse(scraper.hasNextPage(Jsoup.parse(nav(5, 5))));
    }

    @Test
    void noNextPageWithoutPagination() {
        assertFalse(scraper.hasNextPage(Jsoup.parse("<div>no pagination</div>")));
    }

    @Test
    void stillHonoursLegacyNextLink() {
        assertTrue(scraper.hasNextPage(Jsoup.parse("<a class=\"next page-numbers\" href=\"/page/2/\">Next</a>")));
    }
}
