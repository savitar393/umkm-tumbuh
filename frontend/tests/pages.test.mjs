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
let vite, pages, auth, renderer, queryClient, router;
let requests = [];
let slowResponse;
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const storage = new Map();

function registrationResult(name = "Pemilik Uji") {
  return { status: "success", data: {
    users: [{ id: name, full_name: name, email: "owner@stage1.test", role: "UMKM",
      status: "MENUNGGU", is_active: true, created_at: "2026-01-01T00:00:00Z" }],
    pagination: { total: 20, total_pages: 2 },
  } };
}

const server = createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  requests.push(url);
  response.setHeader("Content-Type", "application/json");
  if (url.pathname === "/api/v1/admin/registrations") {
    const search = url.searchParams.get("search");
    if (search === "Lambat") {
      slowResponse = response;
      return;
    }
    response.end(JSON.stringify(registrationResult(search || undefined)));
  } else if (url.pathname === "/api/v1/admin/stats") {
    response.end(JSON.stringify({ status: "success", data: { total: 20, pending: 20, approved: 0, rejected: 0 } }));
  } else if (url.pathname.startsWith("/api/v1/admin/training/")) {
    const id = url.pathname.split("/").at(-1);
    response.end(JSON.stringify({ id, judul_pelatihan: `Pelatihan ${id}`, jenis_pelatihan_id: "JP01",
      durasi_jam: 12, harga: 0, masa_akses_hari: 365, modules: [], assignments: [] }));
  } else if (url.pathname === "/api/v1/products") {
    response.end(JSON.stringify({ products: [] }));
  } else {
    response.writeHead(404);
    response.end(JSON.stringify({ error: `Unexpected request: ${request.url}` }));
  }
});

before(async () => {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  } });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  vite = await createViteServer({
    configFile: false,
    server: { middlewareMode: true, hmr: false },
    define: Object.fromEntries(["API", "AUTH_API", "ADMIN_API", "USER_API", "TRAINING_API", "DOCUMENT_API"]
      .map((service) => [`import.meta.env.VITE_${service}_BASE_URL`, JSON.stringify(baseUrl)])),
  });
  pages = await Promise.all([
    "/src/features/admin/pages/AdminRegistrationsPage.tsx",
    "/src/features/admin/pages/AdminTrainingFormPage.tsx",
    "/src/features/products/pages/ProductListPage.tsx",
  ].map(async (path) => (await vite.ssrLoadModule(path)).default));
  auth = await vite.ssrLoadModule("/src/features/auth/api.ts");
});

beforeEach(() => {
  requests = [];
  storage.clear();
  storage.set("current_user", JSON.stringify({ id: "test-admin", full_name: "Admin Uji", role: "ADMIN" }));
  storage.set("access_token", "test-token");
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});

afterEach(async () => {
  slowResponse?.end(JSON.stringify(registrationResult("Lambat")));
  slowResponse = undefined;
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

async function mount(Page, path, route = path) {
  router = createMemoryRouter([{ path: route, element: h(Page) }], { initialEntries: [path] });
  await act(async () => {
    renderer = create(h(QueryClientProvider, { client: queryClient }, h(RouterProvider, { router })));
  });
}

// Tunggu notifikasi query secara terbatas; semua respons berasal dari server lokal di atas.
async function waitFor(check) {
  const deadline = Date.now() + 3000;
  while (true) {
    await act(async () => { await delay(10); });
    try { check(); return; } catch (error) { if (Date.now() >= deadline) throw error; }
  }
}

const text = (node) => typeof node === "string" ? node : (node.children ?? []).map(text).join("");
const button = (label) => renderer.root.findAllByType("button").find((node) => text(node).trim() === label);
const searchInput = () => renderer.root.findByProps({ placeholder: "Cari nama atau email..." });
const listRequests = () => requests.filter((url) => url.pathname.endsWith("/admin/registrations"));

test("changing a registration filter requests page one", async () => {
  await mount(pages[0], "/admin/registrations");
  await waitFor(() => assert.ok(button("Selanjutnya")));
  await act(async () => button("Selanjutnya").props.onClick());
  await waitFor(() => assert.equal(listRequests().at(-1)?.searchParams.get("page"), "2"));
  await act(async () => renderer.root.findByType("select").props.onChange({ target: { value: "MITRA" } }));
  await waitFor(() => {
    const request = listRequests().at(-1);
    assert.equal(request.searchParams.get("role"), "MITRA");
    assert.equal(request.searchParams.get("page"), "1");
  });
  assert.ok(listRequests().filter((url) => url.searchParams.get("role") === "MITRA")
    .every((url) => url.searchParams.get("page") === "1"));
});

test("an older search response cannot replace the latest registration result", async () => {
  await mount(pages[0], "/admin/registrations");
  await waitFor(() => assert.match(text(renderer.root), /Pemilik Uji/));
  await act(async () => searchInput().props.onChange({ target: { value: "Lambat" } }));
  await waitFor(() => assert.ok(slowResponse));
  await act(async () => searchInput().props.onChange({ target: { value: "Terbaru" } }));
  await waitFor(() => assert.match(text(renderer.root), /Terbaru/));
  slowResponse.end(JSON.stringify(registrationResult("Lambat")));
  await waitFor(() => {
    assert.equal(queryClient.isFetching(), 0);
    assert.match(text(renderer.root), /Terbaru/);
    assert.doesNotMatch(text(renderer.root), /Lambat/);
  });
});

test("training edits survive refetch and reset when opening another training", async () => {
  await mount(pages[1], "/admin/training/T1/edit", "/admin/training/:id/edit");
  const title = () => renderer.root.findByProps({ placeholder: "Strategi Digital Marketing UMKM" });
  await waitFor(() => assert.equal(title().props.value, "Pelatihan T1"));
  await act(async () => title().props.onChange({ target: { value: "Draf belum disimpan" } }));
  await act(async () => {
    await queryClient.refetchQueries({ queryKey: ["admin", "training", "T1"] });
  });
  assert.equal(title().props.value, "Draf belum disimpan");
  await act(async () => { await router.navigate("/admin/training/T2/edit"); });
  await waitFor(() => assert.equal(title().props.value, "Pelatihan T2"));
});

test("product search waits for Filter and can refresh the same filter", async () => {
  await mount(pages[2], "/umkm/products");
  const productRequests = () => requests.filter((url) => url.pathname.endsWith("/products"));
  await waitFor(() => { assert.equal(productRequests().length, 1); assert.equal(queryClient.isFetching(), 0); });
  await act(async () => renderer.root.findByProps({ placeholder: "Nama produk..." })
    .props.onChange({ target: { value: "Kopi" } }));
  assert.equal(productRequests().length, 1);
  await act(async () => button("Filter").props.onClick());
  await waitFor(() => {
    assert.equal(productRequests().length, 2);
    assert.equal(productRequests().at(-1).searchParams.get("q"), "Kopi");
    assert.equal(queryClient.isFetching(), 0);
  });
  await act(async () => { await button("Filter").props.onClick(); });
  await waitFor(() => assert.equal(productRequests().length, 3));
});

test("registration upload returns the document ID and sends the selected file", async (t) => {
  const file = new File(["test document"], "legal.txt", { type: "text/plain" });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/v1/documents/upload");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.equal(options.body.get("category"), "LEGALITAS");
    assert.equal(await options.body.get("file").text(), "test document");
    return Response.json({ document: { id: "doc-test" } });
  });
  const result = await auth.uploadRegistrationDocument(file, "LEGALITAS");
  assert.equal(result.document.id, "doc-test");
});

test("registration upload rejects a success response without a document ID", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ message: "Uploaded" }));
  await assert.rejects(auth.uploadRegistrationDocument(new File(["test"], "legal.txt"), "LEGALITAS"),
    /tidak memuat ID dokumen/);
});

test("registration upload preserves a backend validation error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Jenis berkas tidak didukung" }, { status: 400 }));
  await assert.rejects(auth.uploadRegistrationDocument(new File(["test"], "legal.txt"), "LEGALITAS"),
    /Jenis berkas tidak didukung/);
});
