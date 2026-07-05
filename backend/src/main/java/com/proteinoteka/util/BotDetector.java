package com.proteinoteka.util;

import java.util.regex.Pattern;

public final class BotDetector {

    private static final Pattern BOT_UA = Pattern.compile(
        "(?i)bot|crawler|spider|slurp|bingpreview|facebookexternalhit|twitterbot|" +
        "linkedinbot|whatsapp|telegrambot|googlebot|baiduspider|yandex|semrush|ahrefs|" +
        "mj12bot|dotbot|rogerbot|screaming frog|wget|curl|python-requests|java/"
    );

    private BotDetector() {}

    public static boolean isBot(String userAgent) {
        return userAgent == null || BOT_UA.matcher(userAgent).find();
    }
}
