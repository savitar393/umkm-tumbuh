# Stage 3: partnership contract documents

**English** | [Bahasa Indonesia](README_CONTRACT_DOCUMENTS.id.md)

Contract signing now accepts files uploaded by document-service. The requester uploads and saves a signed contract; the receiver reviews the proposal and approves it separately. Existing legacy contract references remain readable through the same proposal-based download endpoint.

## Upgrade the local application

After applying the Stage 3 patch, run from the repository root:

```bash
docker compose --env-file .env -f infra/docker-compose.yml run --build --rm db-migrate
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --wait --wait-timeout 180 partnerships-service document-service
npm --prefix frontend run check
```

Restart Vite with `npm --prefix frontend run dev`. Keep your existing environment files and Docker volumes. No new environment variables, dummy CSV import, or database reset is needed.

The normal Compose commands use your existing development database. `bash tests/stack/run.sh` uses a separate disposable test project and does not upgrade or seed your development database.

## Browser workflow

1. Log in as the requester and open a submitted proposal → **Dokumen Kontrak**.
2. Choose a signed PDF, JPG, or PNG, up to 10 MiB, then select **Simpan Kontrak**. The file is uploaded as `PARTNERSHIP_FILE` and linked to the proposal. Saving returns to the review page; it does not approve the proposal.
3. Log in as the receiver. Open the same proposal → **Dokumen Kontrak** or **Lanjut ke Persetujuan**, then download the saved contract for review.
4. Select **Setujui & Aktifkan** to approve. The receiver does not upload or sign on behalf of the requester. Approval changes the status to `AKTIF` and closes contract editing.
5. Both participants can reopen **Dokumen Kontrak** and download the saved file, including on closed proposals. Failed downloads show an error; they do not leave the button permanently loading.

Approval keeps the previous business rule: the receiver may approve without a contract. The page states when no contract exists and explains that approval closes contract editing. If a contract is needed, upload it before approving. This stage does not implement electronic signatures or validate the signatures inside a file.

## API and permissions

All routes below require an access token. Document-service now requires HS256, an expiration time, a nonempty `sub`, and a recognized role, matching the partnership/training token rules. Role headers cannot grant access.

| Service / request | Behavior |
| --- | --- |
| Document: `POST /api/v1/documents/upload` | Multipart `file` and `category=PARTNERSHIP_FILE`; returns `document.id` |
| Partnership: `POST /api/v1/partnerships/{id}/sign` | Body `{"dokumen_kontrak":"DOK000001"}`; requester only, with their own active `PARTNERSHIP_FILE` upload |
| Partnership: `GET /api/v1/partnerships/{id}` | Returns effective `contract_document_id`, `contract_document_source` (`CURRENT`/`LEGACY`), and `contract_signed_at` inside `data.pengajuan` |
| Document: `GET /api/v1/partnership-contracts/{id}` | Resolves the proposal's current contract metadata; requester, receiver, or admin |
| Document: `GET /api/v1/partnership-contracts/{id}/download` | Streams the contract bytes after authorization; requester, receiver, or admin |
| Document: `DELETE /api/v1/documents/{id}` | Uploader/admin only; returns 409 while any proposal references it as a current contract |

`{id}` in `partnership-contracts` is a **proposal ID**, not a document ID. The frontend uses the configured document API URL, so the Vite proxy also handles uploads and downloads on WSL. The download uses the authenticated API instead of opening a raw Garage address. Uploads and binary downloads have a 30-second timeout, including reading the response body; metadata and signing/approval requests have a 15-second timeout.

| Contract operation | Allowed proposal status |
| --- | --- |
| Requester saves or replaces a contract | `DIAJUKAN`, `DITINJAU`, `MENUNGGU_DOKUMEN_TTD` |
| Receiver approves/rejects | `DIAJUKAN`, `DITINJAU` |
| Participants download an existing contract | Any status |

Saving a contract leaves the proposal status unchanged. Existing `MENUNGGU_DOKUMEN_TTD` records can receive a file, but this stage does not add an approval transition from that status. Read acknowledgment still does not persist a read timestamp.

Missing/invalid tokens return 401; disallowed callers or unusable document references return 403; invalid/stale transitions and deletion of referenced contracts return 409. Missing contract metadata or a missing stored file returns 404. Upload content rules remain enforced: a public `PRODUCT_IMAGE`, a general document, a deleted upload, or another account's file cannot be submitted as a new contract.

## Schema and legacy compatibility

Migration `032_current_partnership_contracts` adds `partnership.transaksi_pengajuankerjasama.dokumen_kontrak_id`, a nullable foreign key to `documents.master_dokumen`. It retains the old `dokumen_perjanjian_id` foreign key and its values in `document.transaksi_dokumenterunggah`.

The new reference takes precedence. When it is absent, the download endpoint reads the legacy reference explicitly. It never looks up a legacy ID in the current table or falls back to an old file if a current reference is unavailable. This matters because the two tables can contain the same ID for different documents.

Replacing a pending legacy contract stores the new reference while retaining the old reference. The old metadata and stored objects are not copied or deleted by this migration. Existing files must still exist in the bucket/object key recorded in their metadata and be accessible to the configured storage credentials; a metadata row alone cannot restore missing bytes.

Signing and deletion lock the current document row before changing state, preventing a concurrent delete from removing a newly linked contract. Referenced files cannot be soft-deleted through the API or hard-deleted through the new FK. After replacement, the prior file is no longer shared through that contract; it may still be accessible through another proposal/attachment, to its uploader/admin, or through an unexpired URL previously issued by the existing document URL endpoint.

The down migration refuses to drop the new column while it contains contract references. Resolve those references deliberately before a rollback. Normal upgrades only run the up migration.

## Regression checks

```bash
npm --prefix frontend run test:contracts
bash tests/stack/run.sh
```

The frontend suite checks requester/receiver actions, read-only closed contracts, rejected access, upload retry, file validation, proposal-based binary downloads, and pending/partial response timeouts. The full frontend `check` command includes this suite and the existing login/proxy/page tests.

The isolated stack runs the existing Newman and authorization suites plus `tests/stack/contracts.py`. Contract checks cover real uploads and downloaded bytes, foreign-account denial, unsuitable document IDs, replacement/deletion, both requester roles, legacy ID collisions, and concurrent signing/deletion. The runner then rechecks current and legacy contract bytes/access after migration reruns and container recreation.

Legacy fixtures reuse the real file uploaded during `stack-check prepare`; they do not pretend that metadata-only fixtures contain a stored file. These fixture scripts reject databases outside the isolated test scope.

A successful complete run ends with:

```text
Stage 1 stack checks passed.
Stage 2 authorization checks passed.
Stage 3 contract document checks passed.
```

Newman writes `tests/postman/reports/newman.xml`. Authorization and contract tests write `tests/stack/reports/authorization.txt` and `tests/stack/reports/contracts.txt`. CI uploads all available reports as `api-contract-results`, including on failure. Reports are ignored by Git.

CI also runs formatting, vet, race-enabled tests, and builds for document-service. With Go 1.26.3 and a C compiler installed, run the affected Go suites locally:

```bash
(cd services/partnerships-service && go test -race ./...)
(cd services/document-service && go test -race ./...)
```
