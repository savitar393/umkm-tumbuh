import { describe, it, expect, vi } from "vitest";
import { partnershipSoap, SoapFaultError } from "./partnershipSoap";

vi.mock("../auth/currentUser", () => ({
  getAccessToken: () => "fake-jwt",
  getCurrentUser: () => ({ id: "123", role: "UMKM" }),
}));

describe("partnershipSoap", () => {
  it("escapes XML correctly", async () => {
    // we can test this by mocking fetch and inspecting the body
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><par:UpdatePartnershipStatusResponse xmlns:par="http://umkm-tumbuh.example.com/partnerships"><success>true</success></par:UpdatePartnershipStatusResponse></soap:Body></soap:Envelope>`),
    });
    global.fetch = fetchMock;

    await partnershipSoap.reject("id", "<bad>&");

    const call = fetchMock.mock.calls[0][1];
    expect(call.body).toContain("&lt;bad&gt;&amp;");
  });

  it("sends proposalDescription in create", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><par:CreatePartnershipApplicationResponse xmlns:par="http://umkm-tumbuh.example.com/partnerships"><success>true</success></par:CreatePartnershipApplicationResponse></soap:Body></soap:Envelope>`),
    });
    global.fetch = fetchMock;

    await partnershipSoap.create({
      receiver_id: "receiver-1",
      proposal_title: "My Title",
      proposal_description: "My Description",
    });

    const call = fetchMock.mock.calls[0][1];
    expect(call.body).toContain("<proposalDescription>My Description</proposalDescription>");
    expect(call.body).not.toContain("<proposalText>");
  });

  it("parses SOAP fault", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve(`<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><soap:Fault><faultcode>soap:Server</faultcode><faultstring>Internal error</faultstring></soap:Fault></soap:Body></soap:Envelope>`),
    });
    global.fetch = fetchMock;

    await expect(partnershipSoap.getSummary()).rejects.toThrow(SoapFaultError);
  });
});
