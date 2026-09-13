import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import React from "react";
import { act, create } from "react-test-renderer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createServer as createViteServer } from "vite";

const h = React.createElement;
const bytes = Buffer.from([0, 137, 80, 78, 71, 255]);
const storage = new Map();
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
let vite, Approval, Review, api, http, renderer, router, queryClient, baseUrl;
let proposal, requests, signFailures, forbidden, downloadForbidden;

const server = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString();
  requests.push({ method: req.method, path: req.url, headers: req.headers, body });
  res.setHeader("Content-Type", "application/json");
  const json = (data, status = 200) => { res.statusCode = status; res.end(JSON.stringify(data)); };
  if (["/partner/partnerships/P1", "/partner/partnerships/P2"].includes(req.url) && req.method === "GET") {
    if (forbidden) return json({ error: "Anda bukan pihak dalam pengajuan ini" }, 403);
    return json({ success: true, data: { pengajuan: proposal } });
  }
  if (req.url === "/document/documents/upload") return json({ document: { id: "D1" } }, 201);
  if (req.url === "/partner/partnerships/P1/sign") {
    if (signFailures-- > 0) return json({ error: "Gagal menyimpan, coba lagi" }, 500);
    proposal.contract_document_id = "D1";
    return json({ success: true });
  }
  if (req.url === "/partner/partnerships/P1/approve") {
    proposal.status = "AKTIF";
    return json({ success: true });
  }
  if (req.url === "/document/partnership-contracts/P1") {
    return json({ document: { id: "LEGACY1", source: "LEGACY", original_filename: "Kontrak lama.png" } });
  }
  if (req.url === "/document/partnership-contracts/P1/download") {
    if (downloadForbidden) return json({ error: "Anda tidak memiliki akses ke kontrak ini." }, 403);
    res.setHeader("Content-Type", "image/png");
    return res.end(bytes);
  }
  if (req.url === "/partial") {
    res.setHeader("Content-Type", "application/octet-stream");
    res.write(bytes.subarray(0, 2));
    return;
  }
  if (req.url === "/pending") return;
  json({ error: `Unexpected route ${req.url}` }, 404);
});

before(async () => {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  } });
  requests = [];
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  vite = await createViteServer({ configFile: false, server: { middlewareMode: true, hmr: false }, define: {
    "import.meta.env.VITE_PARTNERSHIP_API_BASE_URL": JSON.stringify(baseUrl + "/partner"),
    "import.meta.env.VITE_DOCUMENT_API_BASE_URL": JSON.stringify(baseUrl + "/document"),
  } });
  Approval = (await vite.ssrLoadModule("/src/features/partnerships/pages/PartnershipApprovalPage.tsx")).default;
  Review = (await vite.ssrLoadModule("/src/features/partnerships/pages/PartnershipReviewPage.tsx")).default;
  api = (await vite.ssrLoadModule("/src/features/partnerships/api.ts")).partnershipsApi;
  http = await vite.ssrLoadModule("/src/shared/api/http.ts");
});

beforeEach(() => {
  requests = [];
  signFailures = 0;
  forbidden = downloadForbidden = false;
  proposal = { id: "P1", request_code: "PKS-1", requester_id: "requester", receiver_id: "receiver",
    requester_name: "Usaha Pengaju", receiver_name: "Mitra Penerima", status: "DIAJUKAN",
    proposal_description: "Kerja sama pengembangan produk dan pemasaran.", contract_document_id: null, attachments: [] };
  storage.clear();
  storage.set("access_token", "test-token");
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});

afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
  router?.dispose();
  queryClient.clear();
});

after(async () => {
  await vite?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor);
  else delete globalThis.localStorage;
});

const text = (node) => typeof node === "string" ? node : (node.children ?? []).map(text).join("");
const button = (label) => renderer.root.findAllByType("button").find((node) => text(node).trim() === label);
const mutations = () => requests.filter((req) => req.method !== "GET");

async function waitFor(check) {
  const deadline = Date.now() + 3000;
  while (true) {
    await act(async () => { await delay(10); });
    try { check(); return; } catch (error) { if (Date.now() >= deadline) throw error; }
  }
}

async function mount(id = "requester", role = "UMKM", Page = Approval) {
  storage.set("current_user", JSON.stringify({ id, role, full_name: "Pengguna Uji" }));
  const path = `/${role.toLowerCase()}/partnerships/${Page === Review ? "review" : "approve"}/P1`;
  router = createMemoryRouter([
    { path: path.replace(/\/P1$/, "/:id"), element: h(Page) }, { path: "*", element: h("p", null, "Halaman tujuan") },
  ], { initialEntries: [path] });
  await act(async () => { renderer = create(h(QueryClientProvider, { client: queryClient }, h(RouterProvider, { router }))); });
  await waitFor(() => { assert.equal(queryClient.isFetching(), 0); assert.ok(requests.length); });
}

async function selectFile(file = new File([bytes], "contract.png", { type: "image/png" })) {
  await act(async () => renderer.root.findByProps({ type: "file" }).props.onChange({ target: { files: [file], value: file.name } }));
}

test("requester uploads and signs without approving, then refreshes partnership data", async () => {
  queryClient.setQueryData(["partnerships", "status", "requester"], []);
  await mount();
  assert.ok(button("Simpan Kontrak"));
  assert.equal(button("Setujui & Aktifkan"), undefined);
  await selectFile();
  await act(async () => button("Simpan Kontrak").props.onClick());
  assert.deepEqual(mutations().map((req) => req.path), ["/document/documents/upload", "/partner/partnerships/P1/sign"]);
  assert.equal(mutations()[0].headers.authorization, "Bearer test-token");
  assert.match(mutations()[0].headers["content-type"], /multipart\/form-data; boundary=/);
  assert.match(mutations()[0].body, /PARTNERSHIP_FILE/);
  assert.deepEqual(JSON.parse(mutations()[1].body), { dokumen_kontrak: "D1" });
  assert.equal(router.state.location.pathname, "/umkm/partnerships/review/P1");
  assert.equal(queryClient.getQueryState(["partnerships", "status", "requester"]).isInvalidated, true);
});

test("receiver can approve without being asked to upload or sign", async () => {
  await mount("receiver", "MITRA");
  assert.equal(renderer.root.findAllByProps({ type: "file" }).length, 0);
  assert.equal(button("Simpan Kontrak"), undefined);
  assert.match(text(renderer.root), /Anda dapat menyetujui tanpa kontrak/);
  await act(async () => button("Setujui & Aktifkan").props.onClick());
  assert.deepEqual(mutations().map((req) => req.path), ["/partner/partnerships/P1/approve"]);
  assert.equal(router.state.location.pathname, "/mitra/partnerships/approve/success");
});

test("an active contract remains downloadable without an upload or approval action", async () => {
  proposal.status = "AKTIF";
  proposal.contract_document_id = "D1";
  await mount();
  assert.equal(renderer.root.findAllByProps({ type: "file" }).length, 0);
  assert.equal(button("Simpan Kontrak"), undefined);
  assert.equal(button("Setujui & Aktifkan"), undefined);
  assert.ok(button("Unduh Kontrak Tersimpan"));
});

test("a denied proposal exposes no contract actions", async () => {
  forbidden = true;
  await mount("stranger");
  assert.match(text(renderer.root), /Anda bukan pihak/);
  assert.equal(renderer.root.findAllByProps({ type: "file" }).length, 0);
  assert.equal(button("Simpan Kontrak"), undefined);
  assert.equal(button("Unduh Kontrak Tersimpan"), undefined);
});

test("retry after a linking failure reuses the completed upload", async () => {
  signFailures = 1;
  await mount();
  await selectFile();
  await act(async () => button("Simpan Kontrak").props.onClick());
  assert.match(text(renderer.root), /Gagal menyimpan, coba lagi/);
  assert.equal(button("Simpan Kontrak").props.disabled, false);
  await act(async () => button("Simpan Kontrak").props.onClick());
  assert.deepEqual(mutations().map((req) => req.path), [
    "/document/documents/upload", "/partner/partnerships/P1/sign", "/partner/partnerships/P1/sign",
  ]);
});

test("an unsupported file is rejected before uploading", async () => {
  await mount();
  await selectFile(new File(["not a contract"], "file.txt", { type: "text/plain" }));
  assert.match(text(renderer.root), /Hanya file PDF, JPG, dan PNG/);
  assert.equal(mutations().length, 0);
});

test("opening another proposal clears the previously selected contract", async () => {
  await mount();
  await selectFile();
  assert.match(text(renderer.root), /contract\.png/);
  await act(async () => { await router.navigate("/umkm/partnerships/approve/P2"); });
  await waitFor(() => assert.ok(button("Simpan Kontrak")));
  assert.doesNotMatch(text(renderer.root), /contract\.png/);
  await act(async () => button("Simpan Kontrak").props.onClick());
  assert.equal(mutations().length, 0);
  assert.match(text(renderer.root), /Pilih dokumen kontrak/);
});

test("requester can open the contract page from proposal review", async () => {
  await mount("requester", "UMKM", Review);
  await act(async () => button("Dokumen Kontrak").props.onClick());
  assert.equal(router.state.location.pathname, "/umkm/partnerships/approve/P1");
});

test("legacy download uses the configured document service, proposal ID, and bearer token", async () => {
  const result = await api.downloadContract("P1");
  assert.equal(result.filename, "Kontrak lama.png");
  assert.deepEqual(Buffer.from(await result.blob.arrayBuffer()), bytes);
  assert.deepEqual(requests.map((req) => req.path), [
    "/document/partnership-contracts/P1", "/document/partnership-contracts/P1/download",
  ]);
  assert.ok(requests.every((req) => req.headers.authorization === "Bearer test-token"));
});

test("a binary download preserves a backend permission error", async () => {
  downloadForbidden = true;
  await assert.rejects(api.downloadContract("P1"), (err) => err.status === 403 && /tidak memiliki akses/.test(err.message));
});

for (const path of ["/pending", "/partial"]) {
  test(`binary downloads time out with a ${path.slice(1)} response`, async () => {
    const client = http.createHttpClient(baseUrl);
    await assert.rejects(client.get(path, { responseType: "blob", timeoutMs: 100 }),
      (err) => err.status === 0 && /batas waktu/.test(err.message));
  });
}
