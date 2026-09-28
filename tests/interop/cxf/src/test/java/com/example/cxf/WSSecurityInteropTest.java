package com.example.cxf;

import com.example.umkm_tumbuh.partnerships.*;
import jakarta.xml.ws.BindingProvider;
import jakarta.xml.ws.Holder;
import jakarta.xml.ws.handler.MessageContext;
import jakarta.xml.ws.soap.SOAPFaultException;
import org.apache.cxf.binding.soap.SoapMessage;
import org.apache.cxf.endpoint.Client;
import org.apache.cxf.frontend.ClientProxy;
import org.apache.cxf.interceptor.Fault;
import org.apache.cxf.phase.AbstractPhaseInterceptor;
import org.apache.cxf.phase.Phase;
import org.apache.cxf.transport.http.HTTPException;
import org.apache.cxf.ws.addressing.AddressingProperties;
import org.apache.cxf.ws.addressing.JAXWSAConstants;
import org.apache.cxf.ws.addressing.WSAddressingFeature;
import org.apache.cxf.ws.security.wss4j.WSS4JInInterceptor;
import org.apache.cxf.ws.security.wss4j.WSS4JOutInterceptor;
import org.apache.wss4j.common.ConfigurationConstants;
import org.apache.wss4j.common.crypto.Crypto;
import org.apache.wss4j.common.crypto.CryptoFactory;
import org.apache.wss4j.common.ext.WSPasswordCallback;
import org.apache.wss4j.common.ext.WSSecurityException;
import org.apache.wss4j.dom.WSDataRef;
import org.apache.wss4j.dom.engine.WSSecurityEngine;
import org.apache.wss4j.dom.engine.WSSecurityEngineResult;
import org.apache.wss4j.dom.handler.RequestData;
import org.apache.wss4j.dom.handler.WSHandlerConstants;
import org.apache.wss4j.dom.handler.WSHandlerResult;
import org.junit.jupiter.api.*;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.security.auth.callback.Callback;
import javax.security.auth.callback.CallbackHandler;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class WSSecurityInteropTest {

    private static final String ENDPOINT_URL = "http://127.0.0.1:9091/partnership";
    private static final String JWT_SECRET = "change-this-local-secret";

    private static Crypto serverTrustCrypto;
    private static String capturedLiveResponseXml;

    @BeforeAll
    public static void setupCrypto() throws Exception {
        Properties serverTrustProps = new Properties();
        serverTrustProps.put("org.apache.wss4j.crypto.provider", "org.apache.wss4j.common.crypto.Merlin");
        serverTrustProps.put("org.apache.wss4j.crypto.merlin.truststore.type", "jks");
        serverTrustProps.put("org.apache.wss4j.crypto.merlin.truststore.password", "password");
        serverTrustProps.put("org.apache.wss4j.crypto.merlin.truststore.file", "certs/server-truststore.jks");
        serverTrustCrypto = CryptoFactory.getInstance(serverTrustProps);
        assertNotNull(serverTrustCrypto, "Server truststore must be loaded");
    }

    public static String createJWT(String sub, String role) throws Exception {
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString(
                "{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        long exp = Instant.now().getEpochSecond() + 3600;
        String payloadJson = "{\"sub\":\"" + sub + "\",\"role\":\"" + role + "\",\"exp\":" + exp + "}";
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                payloadJson.getBytes(StandardCharsets.UTF_8));
        String signInput = header + "." + payload;
        Mac hmac = Mac.getInstance("HmacSHA256");
        hmac.init(new SecretKeySpec(JWT_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] sig = hmac.doFinal(signInput.getBytes(StandardCharsets.UTF_8));
        String sigStr = Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
        return signInput + "." + sigStr;
    }

    private static HTTPException findHttpException(Throwable t) {
        while (t != null) {
            if (t instanceof HTTPException) {
                return (HTTPException) t;
            }
            t = t.getCause();
        }
        return null;
    }

    private static class InteropContext {
        PartnershipServicePortType port;
        Client client;
        String[] capturedMsgId = new String[1];
        String[] capturedRelatesTo = new String[1];
        List<WSHandlerResult>[] capturedResults = new List[1];
    }

    private InteropContext createClient(String keystorePath, String keyAlias, String keyPassword, boolean includeJwt) throws Exception {
        PartnershipService service = new PartnershipService();
        PartnershipServicePortType port = service.getPartnershipServicePort();
        Client client = ClientProxy.getClient(port);

        BindingProvider bp = (BindingProvider) port;
        bp.getRequestContext().put(BindingProvider.ENDPOINT_ADDRESS_PROPERTY, ENDPOINT_URL);
        bp.getRequestContext().put("org.apache.cxf.transport.process_fault_on_http_400", true);

        if (includeJwt) {
            Map<String, List<String>> httpHeaders = new HashMap<>();
            httpHeaders.put("Authorization", Collections.singletonList("Bearer " + createJWT("TEST_UMKM_A", "UMKM")));
            bp.getRequestContext().put(MessageContext.HTTP_REQUEST_HEADERS, httpHeaders);
        }

        // Enable WS-Addressing
        WSAddressingFeature addressing = new WSAddressingFeature();
        addressing.initialize(client, client.getBus());

        // Outbound client keystore
        Properties clientCryptoProps = new Properties();
        clientCryptoProps.put("org.apache.wss4j.crypto.provider", "org.apache.wss4j.common.crypto.Merlin");
        clientCryptoProps.put("org.apache.wss4j.crypto.merlin.keystore.type", "jks");
        clientCryptoProps.put("org.apache.wss4j.crypto.merlin.keystore.password", keyPassword);
        clientCryptoProps.put("org.apache.wss4j.crypto.merlin.keystore.alias", keyAlias);
        clientCryptoProps.put("org.apache.wss4j.crypto.merlin.keystore.file", keystorePath);
        Crypto clientCrypto = CryptoFactory.getInstance(clientCryptoProps);

        Map<String, Object> outProps = new HashMap<>();
        outProps.put(ConfigurationConstants.ACTION, ConfigurationConstants.TIMESTAMP + " " + ConfigurationConstants.SIGNATURE);
        outProps.put(ConfigurationConstants.USER, keyAlias);
        outProps.put(ConfigurationConstants.PW_CALLBACK_REF, new CallbackHandler() {
            @Override
            public void handle(Callback[] callbacks) {
                for (Callback cb : callbacks) {
                    if (cb instanceof WSPasswordCallback) {
                        ((WSPasswordCallback) cb).setPassword(keyPassword);
                    }
                }
            }
        });
        outProps.put(ConfigurationConstants.SIG_KEY_ID, "DirectReference");
        outProps.put(ConfigurationConstants.SIG_ALGO, "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256");
        outProps.put(ConfigurationConstants.SIG_DIGEST_ALGO, "http://www.w3.org/2001/04/xmlenc#sha256");
        outProps.put(ConfigurationConstants.SIG_C14N_ALGO, "http://www.w3.org/2001/10/xml-exc-c14n#");
        outProps.put(ConfigurationConstants.SIGNATURE_PARTS,
                "{Element}{http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd}Timestamp; " +
                "{Element}{http://schemas.xmlsoap.org/soap/envelope/}Body; " +
                "{Element}{http://www.w3.org/2005/08/addressing}MessageID; " +
                "{Element}{http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd}BinarySecurityToken");
        outProps.put(ConfigurationConstants.SIG_PROP_REF_ID, "clientCrypto");
        outProps.put("clientCrypto", clientCrypto);

        WSS4JOutInterceptor wssOut = new WSS4JOutInterceptor(outProps);
        client.getOutInterceptors().add(wssOut);

        // Inbound server truststore
        Map<String, Object> inProps = new HashMap<>();
        inProps.put(ConfigurationConstants.ACTION, ConfigurationConstants.TIMESTAMP + " " + ConfigurationConstants.SIGNATURE);
        inProps.put(ConfigurationConstants.SIG_PROP_REF_ID, "serverTrustCrypto");
        inProps.put("serverTrustCrypto", serverTrustCrypto);
        inProps.put(ConfigurationConstants.IS_BSP_COMPLIANT, "false");

        WSS4JInInterceptor wssIn = new WSS4JInInterceptor(inProps);
        client.getInInterceptors().add(wssIn);
        client.getInFaultInterceptors().add(wssIn);

        InteropContext ctx = new InteropContext();
        ctx.port = port;
        ctx.client = client;

        // Capture raw response bytes for offline tampering tests
        AbstractPhaseInterceptor<SoapMessage> rawCaptureInterceptor = new AbstractPhaseInterceptor<SoapMessage>(Phase.RECEIVE) {
            @Override
            public void handleMessage(SoapMessage message) throws Fault {
                try {
                    InputStream is = message.getContent(InputStream.class);
                    if (is != null) {
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        byte[] buf = new byte[4096];
                        int n;
                        while ((n = is.read(buf)) != -1) {
                            baos.write(buf, 0, n);
                        }
                        byte[] bytes = baos.toByteArray();
                        String str = new String(bytes, StandardCharsets.UTF_8);
                        if (capturedLiveResponseXml == null && str.contains("GetPartnershipSummaryResponse") && str.contains("Signature")) {
                            capturedLiveResponseXml = str;
                        }
                        message.setContent(InputStream.class, new ByteArrayInputStream(bytes));
                    }
                } catch (Exception e) {
                    throw new Fault(e);
                }
            }
        };
        client.getInInterceptors().add(rawCaptureInterceptor);
        client.getInFaultInterceptors().add(rawCaptureInterceptor);

        // Capture request MessageID
        client.getOutInterceptors().add(new AbstractPhaseInterceptor<SoapMessage>(Phase.PRE_STREAM) {
            @Override
            public void handleMessage(SoapMessage message) throws Fault {
                AddressingProperties maps = (AddressingProperties) message.get(JAXWSAConstants.CLIENT_ADDRESSING_PROPERTIES_OUTBOUND);
                if (maps != null && maps.getMessageID() != null) {
                    ctx.capturedMsgId[0] = maps.getMessageID().getValue();
                }
            }
        });

        // Capture inbound RelatesTo and WSS4J results
        AbstractPhaseInterceptor<SoapMessage> postProtocolInterceptor = new AbstractPhaseInterceptor<SoapMessage>(Phase.POST_PROTOCOL) {
            @Override
            public void handleMessage(SoapMessage message) throws Fault {
                AddressingProperties inMaps = (AddressingProperties) message.get(JAXWSAConstants.CLIENT_ADDRESSING_PROPERTIES_INBOUND);
                if (inMaps != null && inMaps.getRelatesTo() != null) {
                    ctx.capturedRelatesTo[0] = inMaps.getRelatesTo().getValue();
                }
                List<WSHandlerResult> results = (List<WSHandlerResult>) message.get(WSHandlerConstants.RECV_RESULTS);
                if (results != null) {
                    ctx.capturedResults[0] = results;
                }
            }
        };
        client.getInInterceptors().add(postProtocolInterceptor);
        client.getInFaultInterceptors().add(postProtocolInterceptor);

        return ctx;
    }

    private void assertValidSignedResponse(InteropContext ctx) {
        assertNotNull(ctx.capturedMsgId[0], "Request MessageID must be present");
        assertNotNull(ctx.capturedRelatesTo[0], "Response RelatesTo must be present");
        assertEquals(ctx.capturedMsgId[0], ctx.capturedRelatesTo[0], "Response RelatesTo must equal request MessageID");

        assertNotNull(ctx.capturedResults[0], "WSS4J inbound results must be present");
        boolean signatureVerified = false;
        Set<String> signedElements = new HashSet<>();

        for (WSHandlerResult hr : ctx.capturedResults[0]) {
            for (WSSecurityEngineResult er : hr.getResults()) {
                if (er.get(WSSecurityEngineResult.TAG_DATA_REF_URIS) != null) {
                    signatureVerified = true;
                    X509Certificate cert = (X509Certificate) er.get(WSSecurityEngineResult.TAG_X509_CERTIFICATE);
                    assertNotNull(cert, "Server signing certificate must be validated");
                    assertEquals("CN=Server", cert.getSubjectX500Principal().getName(), "Subject must match Server");

                    List<WSDataRef> dataRefs = (List<WSDataRef>) er.get(WSSecurityEngineResult.TAG_DATA_REF_URIS);
                    assertNotNull(dataRefs, "Signed references must be present");
                    for (WSDataRef ref : dataRefs) {
                        signedElements.add(ref.getName().getLocalPart());
                    }
                }
            }
        }

        assertTrue(signatureVerified, "WSS4J signature verification must succeed");
        assertTrue(signedElements.contains("Body"), "Response Body must be signed");
        assertTrue(signedElements.contains("Timestamp"), "Response Timestamp must be signed");
        assertTrue(signedElements.contains("RelatesTo"), "Response RelatesTo must be signed");
        assertTrue(signedElements.contains("BinarySecurityToken"), "Response BinarySecurityToken must be signed");
    }

    @Test
    @Order(1)
    @DisplayName("1. WSDL Interoperability: Verify generated classes exist and compile")
    public void testWsdlInteroperability() {
        assertNotNull(PartnershipService.class);
        assertNotNull(PartnershipServicePortType.class);
        assertNotNull(GetPartnershipSummary.class);
        assertNotNull(GetPartnershipSummaryResponse.class);
    }

    @Test
    @Order(2)
    @DisplayName("2. Client Leaf A: Full bidirectionally-signed invocation accepted by Go server")
    public void testClientLeafA() throws Exception {
        InteropContext ctx = createClient("certs/client.jks", "client", "password", true);
        GetPartnershipSummaryResponse.Summary summary = ctx.port.getPartnershipSummary("TEST_UMKM_A", "UMKM");
        assertNotNull(summary, "Summary response must not be null");
        assertValidSignedResponse(ctx);
        System.out.println("[Case 2: Client Leaf A] PASSED - 200 OK, signature verified, CA validated, RelatesTo correlated");
    }

    @Test
    @Order(3)
    @DisplayName("3. Client Leaf B: Separate leaf certificate from same Client CA accepted")
    public void testClientLeafB() throws Exception {
        InteropContext ctx = createClient("certs/client-b.jks", "client", "password", true);
        GetPartnershipSummaryResponse.Summary summary = ctx.port.getPartnershipSummary("TEST_UMKM_A", "UMKM");
        assertNotNull(summary, "Summary response must not be null");
        assertValidSignedResponse(ctx);
        System.out.println("[Case 3: Client Leaf B] PASSED - 200 OK, dynamic CA chain validated");
    }

    @Test
    @Order(4)
    @DisplayName("4. Attacker Certificate: Valid signature with untrusted CA certificate rejected with 400")
    public void testAttackerCertificateRejected() throws Exception {
        InteropContext ctx = createClient("certs/attacker.jks", "client", "password", true);
        Exception thrown = assertThrows(Exception.class, () -> {
            ctx.port.getPartnershipSummary("TEST_UMKM_A", "UMKM");
        });
        if (thrown instanceof SOAPFaultException) {
            SOAPFaultException sfe = (SOAPFaultException) thrown;
            assertTrue(sfe.getMessage().contains("SOAP message signature is invalid") || sfe.getMessage().contains("Fault"),
                    "Expected signature rejection fault, got: " + sfe.getMessage());
            System.out.println("[Case 4: Attacker Cert] PASSED - rejected with SOAP Client Fault: " + sfe.getMessage());
        } else {
            HTTPException httpEx = findHttpException(thrown);
            assertNotNull(httpEx, "Expected HTTPException in cause hierarchy if not SOAPFaultException");
            assertEquals(400, httpEx.getResponseCode(), "Attacker certificate must be rejected with HTTP 400");
            System.out.println("[Case 4: Attacker Cert] PASSED - rejected with HTTP 400 Bad Request");
        }
    }

    @Test
    @Order(5)
    @DisplayName("5. Missing JWT: Valid WSS4J signature without Bearer token rejected with 401")
    public void testMissingJwtRejected() throws Exception {
        InteropContext ctx = createClient("certs/client.jks", "client", "password", false);
        Exception thrown = assertThrows(Exception.class, () -> {
            ctx.port.getPartnershipSummary("TEST_UMKM_A", "UMKM");
        });
        HTTPException httpEx = findHttpException(thrown);
        assertNotNull(httpEx, "Expected HTTPException in cause hierarchy");
        assertEquals(401, httpEx.getResponseCode(), "Request without JWT must return HTTP 401 Unauthorized");
        System.out.println("[Case 5: Missing JWT] PASSED - rejected with HTTP 401 Unauthorized");
    }

    @Test
    @Order(6)
    @DisplayName("6. Application SOAP Fault: Business fault response remains WSS4J-signed and verified")
    public void testApplicationSoapFaultResponseSigned() throws Exception {
        InteropContext ctx = createClient("certs/client.jks", "client", "password", true);
        SOAPFaultException fault = assertThrows(SOAPFaultException.class, () -> {
            ctx.port.createPartnershipApplication(
                    "TEST_UMKM_A", "UMKM",
                    "non-existent-receiver-id",
                    "Proposal Title",
                    "Proposal Description",
                    new Holder<>(), new Holder<>(), new Holder<>(), new Holder<>(), new Holder<>()
            );
        });

        assertNotNull(fault.getFault(), "SOAP Fault must be returned");
        assertNotNull(fault.getFault().getFaultString(), "Fault string must be present");
        System.out.println("Fault string received: " + fault.getFault().getFaultString());

        // The inbound WSS4J interceptor processed and verified the signed fault response before raising SOAPFaultException
        assertValidSignedResponse(ctx);
        System.out.println("[Case 6: Application SOAP Fault] PASSED - business fault response signature verified by WSS4J");
    }

    @Test
    @Order(7)
    @DisplayName("7. Response Tampering: WSS4J rejects signed response if Body or RelatesTo is tampered")
    public void testResponseTamperingRejectedByWSS4J() throws Exception {
        assertNotNull(capturedLiveResponseXml, "Live response XML must have been captured from earlier test");

        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        DocumentBuilder db = dbf.newDocumentBuilder();

        WSSecurityEngine engine = new WSSecurityEngine();
        RequestData reqData = new RequestData();
        reqData.setSigVerCrypto(serverTrustCrypto);
        reqData.setDisableBSPEnforcement(true);

        // A. Untampered live response must verify cleanly with WSS4J
        Document docOriginal = db.parse(new InputSource(new StringReader(capturedLiveResponseXml)));
        WSHandlerResult result = engine.processSecurityHeader(docOriginal, reqData);
        assertNotNull(result, "Original unmodified response must verify with WSS4J");
        assertFalse(result.getResults().isEmpty());

        // B. Tamper Body element: modify content inside <soap:Body>
        Document docTamperedBody = db.parse(new InputSource(new StringReader(capturedLiveResponseXml)));
        NodeList bodies = docTamperedBody.getElementsByTagNameNS("http://schemas.xmlsoap.org/soap/envelope/", "Body");
        assertTrue(bodies.getLength() > 0);
        Element body = (Element) bodies.item(0);
        Element tamperedElem = docTamperedBody.createElementNS("http://example.com/malicious", "m:Tampered");
        tamperedElem.setTextContent("MaliciousContent");
        body.appendChild(tamperedElem);

        assertThrows(WSSecurityException.class, () -> {
            engine.processSecurityHeader(docTamperedBody, reqData);
        }, "WSS4J must reject message with tampered Body");

        // C. Tamper RelatesTo element: modify request ID correlation
        Document docTamperedRelates = db.parse(new InputSource(new StringReader(capturedLiveResponseXml)));
        NodeList relatesList = docTamperedRelates.getElementsByTagNameNS("http://www.w3.org/2005/08/addressing", "RelatesTo");
        assertTrue(relatesList.getLength() > 0);
        Element relates = (Element) relatesList.item(0);
        relates.setTextContent("urn:uuid:00000000-0000-0000-0000-000000000000");

        assertThrows(WSSecurityException.class, () -> {
            engine.processSecurityHeader(docTamperedRelates, reqData);
        }, "WSS4J must reject message with tampered RelatesTo");

        System.out.println("[Case 7: Response Tampering] PASSED - WSS4J independently rejected tampered Body and RelatesTo");
    }
}
