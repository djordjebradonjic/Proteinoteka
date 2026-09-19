package com.proteinoteka.service;

import org.junit.jupiter.api.Test;

import javax.net.ssl.X509TrustManager;
import java.io.InputStream;
import java.security.cert.*;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class ProxyAwareHttpClientTest {

    private static X509Certificate loadTestCert(String resource) throws Exception {
        try (InputStream in = ProxyAwareHttpClientTest.class.getClassLoader().getResourceAsStream(resource)) {
            assertNotNull(in, "Missing test resource " + resource);
            return (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(in);
        }
    }

    @Test
    void extendedTrustKeepsDefaultRootsAndAddsSectigoR46() throws Exception {
        X509Certificate[] issuers = ProxyAwareHttpClient.buildExtendedTrustManager().getAcceptedIssuers();

        assertTrue(issuers.length > 50, "Default JVM roots must still be trusted, got " + issuers.length);
        assertTrue(Arrays.stream(issuers).anyMatch(c ->
                        c.getSubjectX500Principal().getName().contains("Sectigo Public Server Authentication Root R46")),
                "Sectigo Root R46 must be an accepted issuer");
    }

    // proteka.hr serves leaf -> "Sectigo Public Server Authentication CA DV R36" (valid to 2036),
    // which chains to Root R46. JDK 21.0.11's cacerts lacks R46, so this path failed with PKIX errors.
    @Test
    void sectigoDvR36IntermediateValidatesAgainstExtendedRoots() throws Exception {
        X509Certificate intermediate = loadTestCert("certs/sectigo-public-server-authentication-ca-dv-r36.pem");
        X509TrustManager tm = ProxyAwareHttpClient.buildExtendedTrustManager();

        Set<TrustAnchor> anchors = Arrays.stream(tm.getAcceptedIssuers())
                .map(c -> new TrustAnchor(c, null))
                .collect(Collectors.toSet());
        PKIXParameters params = new PKIXParameters(anchors);
        params.setRevocationEnabled(false);
        CertPath path = CertificateFactory.getInstance("X.509").generateCertPath(List.of(intermediate));

        assertDoesNotThrow(() -> CertPathValidator.getInstance("PKIX").validate(path, params));
    }

    @Test
    void extendedTrustStillRejectsUnknownSelfSignedCertificate() throws Exception {
        X509Certificate untrusted = loadTestCert("certs/untrusted-self-signed.pem");
        X509TrustManager tm = ProxyAwareHttpClient.buildExtendedTrustManager();

        assertThrows(CertificateException.class,
                () -> tm.checkServerTrusted(new X509Certificate[]{untrusted}, "RSA"));
    }
}
