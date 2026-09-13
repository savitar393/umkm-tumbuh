"""Contract upload, signing, download, and legacy compatibility on the real stack."""

from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import sys
from threading import Barrier
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from authorization import PARTNERSHIP, request
from check import AUTH, DOCUMENT, PNG, TEXT, upload


STATE = Path("/state/contracts.json")


def login_tokens():
    return {account: request(AUTH + "/auth/login", "POST", {
        "email": account + "@stage1.test", "password": "Stage1Test123!",
    })["access_token"] for account in ("admin", "umkm.a", "umkm.b", "mitra.a", "mitra.b")}


class ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tokens = login_tokens()

    def document(self, account="umkm.a", category="PARTNERSHIP_FILE"):
        return upload(DOCUMENT + "/documents/upload", self.tokens[account], "file",
                      "contract.png", "image/png", PNG, {"category": category}, expected=201)["document"]["id"]

    def proposal(self, account="umkm.a", receiver="TEST_PARTNER_A"):
        result = request(PARTNERSHIP + "/partnerships", "POST", {
            "receiver_id": receiver, "proposal_title": "Pengajuan kontrak pengujian",
            "proposal_description": "Kerja sama sintetis untuk memeriksa dokumen kontrak dan hak aksesnya.",
            "attachment_files": [],
        }, self.tokens[account])
        return result["data"]["pengajuanID"]

    def sign(self, proposal, document, account="umkm.a", expected=200):
        return request(PARTNERSHIP + f"/partnerships/{proposal}/sign", "POST",
                       {"dokumen_kontrak": document}, self.tokens[account], expected=expected)

    def detail(self, proposal, account="umkm.a"):
        return request(PARTNERSHIP + "/partnerships/" + proposal,
                       token=self.tokens[account])["data"]["pengajuan"]

    def test_current_contract_upload_sign_and_download(self):
        proposal, document = self.proposal(), self.document()
        direct = DOCUMENT + f"/documents/{document}/download"
        request(direct, token=self.tokens["mitra.a"], expected=403)
        request(DOCUMENT + f"/partnership-contracts/{proposal}", token=self.tokens["umkm.a"], expected=404)
        self.sign(proposal, document)
        detail = self.detail(proposal)
        self.assertEqual(detail["contract_document_id"], document)
        self.assertEqual(detail["contract_document_source"], "CURRENT")
        self.assertTrue(detail["contract_signed_at"])
        self.assertEqual(detail["status"], "DIAJUKAN")
        url = DOCUMENT + f"/partnership-contracts/{proposal}"
        for account in ("umkm.a", "mitra.a", "admin"):
            metadata = request(url, token=self.tokens[account])["document"]
            self.assertEqual(metadata["id"], document)
            self.assertEqual(metadata["source"], "CURRENT")
            self.assertEqual(request(url + "/download", token=self.tokens[account], raw=True), PNG)
        for account in ("umkm.b", "mitra.b"):
            request(url, token=self.tokens[account], expected=403)
            request(url + "/download", token=self.tokens[account], expected=403)
        request(url + "/download", expected=401)
        request(DOCUMENT + f"/public/documents/{document}/view", expected=403)
        self.assertEqual(request(direct, token=self.tokens["mitra.a"], raw=True), PNG)
        request(PARTNERSHIP + f"/partnerships/{proposal}/approve", "PATCH", {}, self.tokens["mitra.a"])
        STATE.write_text(json.dumps({"proposal": proposal, "document": document}))

    def test_sign_rejects_unusable_or_foreign_uploads(self):
        proposal = self.proposal()
        deleted = self.document()
        request(DOCUMENT + "/documents/" + deleted, "DELETE", token=self.tokens["umkm.a"])
        for document in ("missing", "TEST_CONTRACT_A", "TEST_CONTRACT_B", deleted,
                         self.document("umkm.b"), self.document(category="GENERAL_DOCUMENT"),
                         self.document(category="PRODUCT_IMAGE")):
            with self.subTest(document=document):
                self.sign(proposal, document, expected=403)
        self.assertIsNone(self.detail(proposal)["contract_document_id"])

    def test_read_access_cannot_delete_and_replacement_revokes_old_access(self):
        proposal, first, second = self.proposal(), self.document(), self.document()
        self.sign(proposal, first)
        url = DOCUMENT + "/documents/" + first
        request(url, "DELETE", token=self.tokens["mitra.a"], expected=403)
        for account in ("umkm.a", "admin"):
            request(url, "DELETE", token=self.tokens[account], expected=409)
        self.sign(proposal, second)
        self.assertEqual(self.detail(proposal)["contract_document_id"], second)
        request(url + "/download", token=self.tokens["mitra.a"], expected=403)
        request(url, "DELETE", token=self.tokens["umkm.a"])
        request(url + "/download", token=self.tokens["umkm.a"], expected=404)
        self.assertEqual(request(DOCUMENT + f"/partnership-contracts/{proposal}/download",
                                 token=self.tokens["mitra.a"], raw=True), PNG)

    def test_legacy_download_does_not_resolve_a_current_id_collision(self):
        url = DOCUMENT + "/partnership-contracts/TEST_LEGACY_A"
        for account in ("umkm.a", "mitra.a", "admin"):
            metadata = request(url, token=self.tokens[account])["document"]
            self.assertEqual(metadata["source"], "LEGACY")
            self.assertEqual(metadata["original_filename"], "stage1.txt")
            self.assertEqual(request(url + "/download", token=self.tokens[account], raw=True), TEXT)
        for account in ("umkm.b", "mitra.b"):
            request(url, token=self.tokens[account], expected=403)
            request(url + "/download", token=self.tokens[account], expected=403)
        for account in ("umkm.a", "mitra.a"):
            request(DOCUMENT + "/documents/TEST_CONTRACT_A", token=self.tokens[account], expected=403)
        self.assertEqual(self.detail("TEST_LEGACY_A")["contract_document_source"], "LEGACY")

    def test_pending_legacy_contract_can_be_replaced_with_a_current_upload(self):
        document = self.document()
        self.sign("TEST_LEGACY_REPLACE", document)
        detail = self.detail("TEST_LEGACY_REPLACE")
        self.assertEqual(detail["contract_document_source"], "CURRENT")
        self.assertEqual(detail["contract_document_id"], document)
        self.assertEqual(request(DOCUMENT + "/partnership-contracts/TEST_LEGACY_REPLACE/download",
                                 token=self.tokens["mitra.a"], raw=True), PNG)
        self.assertEqual(self.detail("TEST_LEGACY_A")["contract_document_source"], "LEGACY")

    def test_mitra_requester_can_sign_and_umkm_receiver_can_read(self):
        proposal, document = self.proposal("mitra.a", "TEST_BUSINESS_A"), self.document("mitra.a")
        self.sign(proposal, document, "umkm.a", expected=403)
        self.sign(proposal, document, "mitra.a")
        self.assertEqual(request(DOCUMENT + f"/partnership-contracts/{proposal}/download",
                                 token=self.tokens["umkm.a"], raw=True), PNG)
        request(PARTNERSHIP + f"/partnerships/{proposal}/approve", "PATCH", {}, self.tokens["umkm.a"])
        self.sign(proposal, document, "mitra.a", expected=409)

    def test_sign_and_delete_race_never_leaves_an_unreadable_contract(self):
        proposal, document = self.proposal(), self.document()
        barrier = Barrier(2)

        def compete(method, url, data=None):
            headers = {"Authorization": "Bearer " + self.tokens["umkm.a"], "Content-Type": "application/json"}
            barrier.wait(timeout=10)
            try:
                with urlopen(Request(url, data=json.dumps(data).encode() if data else None,
                                     headers=headers, method=method), timeout=15) as response:
                    return response.status
            except HTTPError as error:
                return error.code

        with ThreadPoolExecutor(max_workers=2) as executor:
            signing = executor.submit(compete, "POST", PARTNERSHIP + f"/partnerships/{proposal}/sign", {"dokumen_kontrak": document})
            deleting = executor.submit(compete, "DELETE", DOCUMENT + "/documents/" + document)
            sign_status, delete_status = signing.result(), deleting.result()
        if sign_status == 200:
            self.assertEqual(delete_status, 409)
            self.assertEqual(request(DOCUMENT + f"/partnership-contracts/{proposal}/download",
                                     token=self.tokens["mitra.a"], raw=True), PNG)
        else:
            self.assertIn(sign_status, (403, 409))
            self.assertEqual(delete_status, 200)
            self.assertIsNone(self.detail(proposal)["contract_document_id"])


def verify_persistence():
    tokens = login_tokens()
    state = json.loads(STATE.read_text())
    for proposal, expected, source in ((state["proposal"], PNG, "CURRENT"), ("TEST_LEGACY_A", TEXT, "LEGACY")):
        url = DOCUMENT + "/partnership-contracts/" + proposal
        metadata = request(url, token=tokens["mitra.a"])["document"]
        assert metadata["source"] == source
        assert request(url + "/download", token=tokens["mitra.a"], raw=True) == expected
        request(url + "/download", token=tokens["umkm.b"], expected=403)
    print("PASS: current and legacy contract bytes and access controls survive migrations/recreation", flush=True)


if __name__ == "__main__":
    if sys.argv[1:] == ["--verify-persistence"]:
        verify_persistence()
    else:
        unittest.main(verbosity=2)
