"""Regresi SOAP/WSDL dan konsistensi REST pada stack uji terisolasi."""

import base64
from concurrent.futures import ThreadPoolExecutor
import json
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

from authorization import PARTNERSHIP, request
from contracts import login_tokens
from check import DOCUMENT, PNG, upload

SOAP = "http://soap-partnerships-service:9090/partnership"
NS = "http://umkm-tumbuh.example.com/partnerships"
ENV = "http://schemas.xmlsoap.org/soap/envelope/"
XSD = "{http://www.w3.org/2001/XMLSchema}"
ET.register_namespace("soap", ENV)
ET.register_namespace("tns", NS)


class SOAPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tokens = login_tokens()
        with urlopen(SOAP + "?wsdl", timeout=10) as response:
            cls.wsdl = ET.fromstring(response.read())
        cls.schema = cls.wsdl.find(".//" + XSD + "schema")
        cls.seen = set()

    def validate_schema(self, value, declaration):
        """Periksa sequence, occurrence, namespace, dan tipe yang dipakai WSDL ini."""
        kind = declaration.get("type")
        if kind and kind.startswith("xsd:"):
            self.assertEqual(len(value), 0)
            if kind == "xsd:int":
                self.assertTrue(-(2**31) <= int(value.text) < 2**31)
            elif kind == "xsd:boolean":
                self.assertIn(value.text, ("true", "false", "0", "1"))
            else:
                self.assertEqual(kind, "xsd:string")
            return
        if kind:
            declaration = self.schema.find(f"{XSD}complexType[@name='{kind.split(':')[1]}']")
        else:
            declaration = declaration.find(XSD + "complexType")
        sequence = declaration.find(XSD + "sequence")
        children = list(value)
        index = 0
        for field in sequence:
            count = 0
            while index < len(children) and children[index].tag == field.get("name"):
                self.validate_schema(children[index], field)
                index += 1
                count += 1
            self.assertGreaterEqual(count, int(field.get("minOccurs", "1")), field.attrib)
            maximum = field.get("maxOccurs", "1")
            if maximum != "unbounded":
                self.assertLessEqual(count, int(maximum), field.attrib)
        self.assertEqual(index, len(children), ET.tostring(value))

    def call(self, operation, fields=None, account="umkm.a", expected=200, identity=None):
        token = self.tokens[account]
        claims = json.loads(base64.urlsafe_b64decode(token.split(".")[1] + "===") )
        envelope = ET.Element("{" + ENV + "}Envelope")
        body = ET.SubElement(envelope, "{" + ENV + "}Body")
        payload = ET.SubElement(body, "{" + NS + "}" + operation)
        values = {"userId": claims["sub"], "userRole": claims["role"], **(fields or {})}
        if identity:
            values.update(identity)
        for name, value in values.items():
            ET.SubElement(payload, name).text = str(value)
        declaration = self.schema.find(f"{XSD}element[@name='{operation}']")
        self.assertIsNotNone(declaration)
        self.validate_schema(payload, declaration)
        req = Request(SOAP, data=ET.tostring(envelope), headers={
            "Authorization": "Bearer " + token, "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": '"' + NS + '/' + operation + '"',
        })
        try:
            with urlopen(req, timeout=15) as response:
                status, data = response.status, response.read()
        except HTTPError as error:
            status, data = error.code, error.read()
        self.assertEqual(status, expected, data)
        root = ET.fromstring(data)
        self.assertEqual(root.tag, "{" + ENV + "}Envelope")
        result = root.find("{" + ENV + "}Body")[0]
        if expected != 200:
            self.assertEqual(result.tag, "{" + ENV + "}Fault")
        else:
            self.assertEqual(result.tag, "{" + NS + "}" + operation + "Response")
            self.validate_schema(result, self.schema.find(f"{XSD}element[@name='{operation}Response']"))
            self.seen.add(operation)
        return result

    def create(self, account="umkm.a", receiver="TEST_PARTNER_A"):
        return self.call("CreatePartnershipApplication", {
            "receiverId": receiver, "proposalTitle": "Pengajuan SOAP integrasi",
            "proposalDescription": "Kerja sama sintetis untuk menguji integrasi SOAP dan REST.",
        }, account).findtext("applicationId")

    def detail(self, proposal, account="umkm.a"):
        return request(PARTNERSHIP + "/partnerships/" + proposal, token=self.tokens[account])["data"]["pengajuan"]

    def document(self, account="umkm.a", category="PARTNERSHIP_FILE"):
        return upload(DOCUMENT + "/documents/upload", self.tokens[account], "file", "soap.png",
                      "image/png", PNG, {"category": category}, expected=201)["document"]["id"]

    def test_contract_round_trip_and_all_operations(self):
        address = self.wsdl.find(".//{http://schemas.xmlsoap.org/wsdl/soap/}address")
        self.assertEqual(address.get("location"), SOAP)
        title = "Judul SOAP khas: kopi & kakao 739"
        description = "Deskripsi SOAP khas yang harus tersimpan utuh, bukan judul hasil tebakan."
        proposal = self.call("CreatePartnershipApplication", {
            "receiverId": "TEST_PARTNER_A", "proposalTitle": title, "proposalDescription": description,
        }).findtext("applicationId")
        rest = self.detail(proposal)
        detail = self.call("GetPartnershipApplication", {"applicationId": proposal})
        self.assertEqual(detail.findtext("proposalText"), title + "\n\n" + description)
        for soap, key in (("applicationId", "id"), ("requestCode", "request_code"),
                          ("proposalText", "proposal_description"), ("status", "status")):
            self.assertEqual(detail.findtext(soap), rest[key])
        self.call("MarkPartnershipAsRead", {"applicationId": proposal}, "mitra.a")
        self.assertEqual(self.detail(proposal)["status"], "DIAJUKAN")
        document = self.document()
        self.call("SignPartnership", {"applicationId": proposal, "documentId": document})
        self.assertEqual(self.detail(proposal)["contract_document_source"], "CURRENT")
        self.assertEqual(self.detail(proposal)["contract_document_id"], document)
        self.assertEqual(self.call("GetPartnershipApplication", {"applicationId": proposal}).findtext("contractDocumentId"), document)
        self.assertEqual(request(DOCUMENT + f"/partnership-contracts/{proposal}/download",
                                 token=self.tokens["mitra.a"], raw=True), PNG)
        self.call("UpdatePartnershipStatus", {"applicationId": proposal, "status": "AKTIF"}, "mitra.a")
        self.assertEqual(self.detail(proposal)["status"], "AKTIF")
        for operation, path, account, list_key, status_key in (
            ("GetPartnershipApplications", "/partnerships/status", "umkm.a", "pengajuan", "statusPengajuan"),
            ("GetIncomingPartnerships", "/partnerships/incoming", "mitra.a", "pengajuan_masuk", "status"),
        ):
            result = self.call(operation, {"status": "AKTIF", "page": 1, "limit": 100}, account)
            rest = request(PARTNERSHIP + path + "?status=AKTIF&page=1&limit=100", token=self.tokens[account])["data"]
            self.assertEqual(int(result.findtext("totalCount")), rest["pagination"]["total"])
            self.assertEqual([(x.findtext("applicationId"), x.findtext("status")) for x in result.findall("applications/application")],
                             [(x["pengajuanID"], x[status_key]) for x in rest[list_key]])
            self.call(operation, {"status": "UNKNOWN", "page": 1, "limit": 100}, account, expected=400)
        for operation, path, account in (
            ("GetPartnershipSummary", "/partnerships/summary", "umkm.a"),
            ("GetIncomingPartnershipSummary", "/partnerships/incoming/summary", "mitra.a"),
        ):
            result = self.call(operation, account=account)
            counts = {x.findtext("status"): int(x.findtext("count")) for x in result.findall("summary/item")}
            rest = request(PARTNERSHIP + path, token=self.tokens[account])["data"]["summary"]
            if account == "umkm.a":
                self.assertEqual(counts.get("AKTIF", 0) + counts.get("SELESAI", 0), rest["bermitra"])
            else:
                self.assertEqual(sum(counts.values()), rest["total"])
        self.assertEqual(len(self.seen), 9)

    def test_validation_authorization_and_transitions(self):
        self.call("CreatePartnershipApplication", {"receiverId": "TEST_PARTNER_A", "proposalTitle": "short",
                  "proposalDescription": "short"}, expected=400)
        for title, description in ((" " * 20, "d" * 40), ("t" * 20, " " * 40)):
            self.call("CreatePartnershipApplication", {"receiverId": "TEST_PARTNER_A", "proposalTitle": title,
                      "proposalDescription": description}, expected=400)
        proposal = self.create()
        missing = self.call("GetPartnershipApplication", {"applicationId": "MISSING"}, expected=404)
        inaccessible = self.call("GetPartnershipApplication", {"applicationId": proposal}, "umkm.b", 404)
        self.assertEqual(ET.tostring(missing), ET.tostring(inaccessible))
        request(PARTNERSHIP + "/partnerships/" + proposal, token=self.tokens["umkm.b"], expected=403)
        for operation, fields, account, expected in (
            ("GetPartnershipApplication", {}, "umkm.b", 404),
            ("GetPartnershipApplication", {}, "admin", 403),
            ("MarkPartnershipAsRead", {}, "umkm.a", 403),
            ("UpdatePartnershipStatus", {"status": "AKTIF"}, "umkm.a", 403),
            ("UpdatePartnershipStatus", {"status": "DIBATALKAN"}, "mitra.a", 403),
            ("UpdatePartnershipStatus", {"status": "DITOLAK"}, "mitra.a", 422),
            ("UpdatePartnershipStatus", {"status": "APPROVED"}, "mitra.a", 400),
            ("SignPartnership", {"documentId": self.document()}, "mitra.a", 403),
            ("SignPartnership", {"documentId": self.document("umkm.b")}, "umkm.a", 403),
            ("SignPartnership", {"documentId": self.document(category="PRODUCT_IMAGE")}, "umkm.a", 403),
            ("SignPartnership", {"documentId": "TEST_CONTRACT_A"}, "umkm.a", 403),
        ):
            with self.subTest(operation=operation, account=account, fields=fields):
                self.call(operation, {"applicationId": proposal, **fields}, account, expected)
        self.call("GetPartnershipApplication", {"applicationId": proposal}, expected=403, identity={"userId": "TEST_UMKM_B"})
        self.call("UpdatePartnershipStatus", {"applicationId": proposal, "status": "DITOLAK", "rejectionReason": "Tidak sesuai"}, "mitra.a")
        self.assertEqual(self.detail(proposal)["status"], "DITOLAK")
        self.call("UpdatePartnershipStatus", {"applicationId": proposal, "status": "AKTIF"}, "mitra.a", 409)
        proposal = self.create("mitra.a", "TEST_BUSINESS_A")
        document = self.document("mitra.a")
        self.call("SignPartnership", {"applicationId": proposal, "documentId": document}, "mitra.a")
        request(PARTNERSHIP + f"/partnerships/{proposal}/approve", "PATCH", {}, self.tokens["umkm.a"])
        self.call("SignPartnership", {"applicationId": proposal, "documentId": document}, "mitra.a", 409)
        proposal = self.create()
        self.call("UpdatePartnershipStatus", {"applicationId": proposal, "status": "DIBATALKAN"})
        self.assertEqual(self.detail(proposal)["status"], "DIBATALKAN")

    def test_imported_identifiers_survive_application_creation(self):
        for id, code, text in (("PGJ900000", "PKS-2025-910000", "Imported proposal sentinel A"),
                               ("PGJ900002", "PKS-2025-900002", "Imported proposal sentinel B")):
            before = self.detail(id)
            self.assertEqual(before["request_code"], code)
            self.assertEqual(before["proposal_description"], text)
            created = self.create()
            self.assertGreater(int(created[3:]), 910000)
            self.assertEqual(self.detail(id), before)
            self.assertNotEqual(created, id)

    def test_small_concurrent_rest_and_soap_creation(self):
        def create(index):
            if index % 2:
                return self.create()
            result = request(PARTNERSHIP + "/partnerships", "POST", {
                "receiver_id": "TEST_PARTNER_A", "proposal_title": "Pengajuan REST integrasi",
                "proposal_description": "Kerja sama sintetis untuk memeriksa alokasi nomor bersama.",
            }, self.tokens["umkm.a"])
            return result["data"]["pengajuanID"]
        with ThreadPoolExecutor(max_workers=4) as pool:
            ids = list(pool.map(create, range(8)))
        self.assertEqual(len(set(ids)), 8)
        self.assertEqual(len({self.detail(i)["request_code"] for i in ids}), 8)


if __name__ == "__main__":
    unittest.main(verbosity=2)
