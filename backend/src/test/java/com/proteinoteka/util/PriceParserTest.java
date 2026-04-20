package com.proteinoteka.util;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PriceParserTest {

    @Autowired
    PriceParser parser;

    @Test
    void srpskiFormat() {
        assertEquals(1950.00, parser.parse("1.950,00 RSD"));
        assertEquals(2490.00, parser.parse("2.490,00 RSD"));
        assertEquals(950.00,  parser.parse("950,00 RSD"));
    }

    @Test
    void americkiFormat() {
        assertEquals(1950.00, parser.parse("1,950.00"));
        assertEquals(950.00,  parser.parse("950.00"));
    }

    @Test
    void bezDecimala() {
        assertEquals(2490.00, parser.parse("2.490"));
        assertEquals(950.00,  parser.parse("950"));
        assertEquals(12490.00, parser.parse("12.490"));     // srpski hiljadar
        assertEquals(1234490.00, parser.parse("1.234.490")); // vise hiljadara - edge case

    }

    @Test
    void invalidInput() {
        assertNull(parser.parse(""));
        assertNull(parser.parse(null));
        assertNull(parser.parse("N/A"));
        assertNull(parser.parse("0,00"));
        assertNull(parser.parse("nema cene"));
    }

    @Test
    void granicniSlucajevi() {
        assertEquals(2.49,    parser.parse("2.49"));        // americki decimalni
        assertEquals(1950.00, parser.parse("1950.00"));     // americki bez hiljadara
        assertEquals(99.90,   parser.parse("99.90"));       // dva decimalna mesta != 3
    }
}