package com.proteinoteka.analytics;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Stateless engine — takes a metrics snapshot and returns actionable decision rules.
 * No DB access. No side effects. Easy to unit-test.
 */
@Service
public class DecisionRulesEngine {

    // ── Thresholds ────────────────────────────────────────────────────────────────

    private static final double OPEN_RATE_LOW       = 0.20;
    private static final double OPEN_RATE_HIGH      = 0.35;
    private static final double CLICK_RATE_LOW      = 0.10;
    private static final double CLICK_RATE_HIGH     = 0.20;
    private static final double CONVERSION_LOW      = 0.20;
    private static final double TIME_TO_CREATE_SLOW = 4_000;
    private static final double UNSUB_RATE_HIGH     = 0.05;
    private static final double FAILURE_RATE_HIGH   = 0.02;
    private static final double REPEAT_RATE_HIGH    = 0.25;

    // ── Public API ────────────────────────────────────────────────────────────────

    public List<DecisionRule> evaluate(AlertMetrics m) {
        List<DecisionRule> rules = new ArrayList<>();

        evaluateEmailOpenRate(m, rules);
        evaluateClickRate(m, rules);
        evaluateConversionRate(m, rules);
        evaluateTimeToCreate(m, rules);
        evaluateUnsubscribeRate(m, rules);
        evaluateFailureRate(m, rules);
        evaluateRepeatUsers(m, rules);

        return rules;
    }

    // ── Rule evaluators ───────────────────────────────────────────────────────────

    private void evaluateEmailOpenRate(AlertMetrics m, List<DecisionRule> out) {
        if (m.jobsSent() == 0) return;

        if (m.openRate() < OPEN_RATE_LOW) {
            out.add(new DecisionRule(
                    DecisionFlag.EMAIL_PROBLEM_SUBJECT_OR_TIMING,
                    DecisionRule.Severity.WARNING,
                    String.format("Email open rate je %.1f%% — ispod praga od 20%%", m.openRate() * 100),
                    "A/B testuj subject linije. Format koji funkcioniše: 'Cena [Naziv] upravo pala!'. " +
                    "Pokušaj slanje Uto/Sre 10–11h. Provjeri da li Resend nije ušao u spam folder."
            ));
        } else if (m.openRate() > OPEN_RATE_HIGH) {
            out.add(new DecisionRule(
                    DecisionFlag.SCALE_EMAIL_CAMPAIGN,
                    DecisionRule.Severity.SUCCESS,
                    String.format("Email open rate je %.1f%% — iznad cilja od 35%%", m.openRate() * 100),
                    "Kvalitet emaila je jak. Razmotri weekly digest za sve wishlist korisnike " +
                    "ili povećanje frekvencije alertova."
            ));
        }
    }

    private void evaluateClickRate(AlertMetrics m, List<DecisionRule> out) {
        if (m.jobsSent() == 0) return;

        if (m.clickRate() < CLICK_RATE_LOW) {
            out.add(new DecisionRule(
                    DecisionFlag.CTA_OR_VALUE_PROPOSITION_PROBLEM,
                    DecisionRule.Severity.WARNING,
                    String.format("Email CTR je %.1f%% — ispod praga od 10%%", m.clickRate() * 100),
                    "Provjeri copy CTA dugmeta. Testiraj 'Kupi za X RSD →' vs 'Pogledaj cenu'. " +
                    "Osiguraj da je procenat pada prikazan prominentno odmah ispod cijene."
            ));
        } else if (m.clickRate() > CLICK_RATE_HIGH) {
            out.add(new DecisionRule(
                    DecisionFlag.HIGH_PERFORMING_EMAIL,
                    DecisionRule.Severity.SUCCESS,
                    String.format("Email CTR je %.1f%% — iznad cilja od 20%%", m.clickRate() * 100),
                    "Email template dobro funkcioniše. Dokumentuj kao control varijantu za buduće A/B testove."
            ));
        }
    }

    private void evaluateConversionRate(AlertMetrics m, List<DecisionRule> out) {
        if (m.conversionRate() == null) return;

        if (m.conversionRate() < CONVERSION_LOW) {
            out.add(new DecisionRule(
                    DecisionFlag.UX_FRICTION_MODAL_FLOW,
                    DecisionRule.Severity.WARNING,
                    String.format("Modal conversion rate je %.1f%% — ispod praga od 20%%", m.conversionRate() * 100),
                    "Smanji broj polja u modalu. Pre-filluj email iz cookie-ja. " +
                    "Razmotri single-tap flow za povratne korisnike koji već imaju sačuvan email."
            ));
        }
    }

    private void evaluateTimeToCreate(AlertMetrics m, List<DecisionRule> out) {
        if (m.avgTimeToCreateMs() == null) return;

        if (m.avgTimeToCreateMs() > TIME_TO_CREATE_SLOW) {
            out.add(new DecisionRule(
                    DecisionFlag.UX_TOO_SLOW,
                    DecisionRule.Severity.WARNING,
                    String.format("Prosječno vrijeme kreiranja alerta je %.1fs — iznad praga od 4s",
                            m.avgTimeToCreateMs() / 1000.0),
                    "Provjeri email input validaciju. Razmotri auto-submit kada je email validan. " +
                    "Target price checkbox može biti problem — izmjeri gdje korisnici gube fokus."
            ));
        }
    }

    private void evaluateUnsubscribeRate(AlertMetrics m, List<DecisionRule> out) {
        if (m.jobsSent() == 0) return;

        if (m.unsubscribeRate() > UNSUB_RATE_HIGH) {
            out.add(new DecisionRule(
                    DecisionFlag.AUDIENCE_MISMATCH,
                    DecisionRule.Severity.WARNING,
                    String.format("Unsubscribe rate je %.1f%% — iznad praga od 5%%", m.unsubscribeRate() * 100),
                    "Padovi cijene možda nisu dovoljno relevantni. Provjeri minimum threshold " +
                    "(trenutno 5%/300 RSD). Razmotri povećanje na 10%/500 RSD za manje engaged segmente."
            ));
        }
    }

    private void evaluateFailureRate(AlertMetrics m, List<DecisionRule> out) {
        long total = m.jobsSent() + m.jobsFailed();
        if (total == 0) return;

        if (m.failureRate() > FAILURE_RATE_HIGH) {
            out.add(new DecisionRule(
                    DecisionFlag.SYSTEM_RELIABILITY_ISSUE,
                    DecisionRule.Severity.WARNING,
                    String.format("Alert job failure rate je %.1f%% — iznad praga od 2%%", m.failureRate() * 100),
                    "Provjeri RESEND_API_KEY expiry i email delivery logs. " +
                    "Pregledaj failure_reason polje u alert_jobs tabeli za konkretne greške."
            ));
        }
    }

    private void evaluateRepeatUsers(AlertMetrics m, List<DecisionRule> out) {
        if (m.uniqueEmails() == 0) return;

        if (m.repeatUserRate() > REPEAT_RATE_HIGH) {
            out.add(new DecisionRule(
                    DecisionFlag.STRONG_RETENTION_SIGNAL,
                    DecisionRule.Severity.SUCCESS,
                    String.format("%.1f%% korisnika ima 2+ alerta — jak retention signal", m.repeatUserRate() * 100),
                    "Investiraj u retention: weekly digest email, wishlist sharing, referral program. " +
                    "Ovaj segment je najvrjedniji — segmentiraj i targetiraj posebno."
            ));
        }
    }
}
