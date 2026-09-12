import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { createServer as createViteServer } from "vite";

const credentials = { email: "login@stage1.test", password: "test-password" };
const loginResponse = { access_token: "test-token", user: { role: "ADMIN" } };
let scenario = "success";
let lastRequest;
let vite;
let auth;
let api;
let baseUrl;

// Server lokal meniru respons auth; tidak memakai database atau akun asli.
const server = createServer(async (request, response) => {
  let body = "";
  for await (const chunk of request) body += chunk;
  lastRequest = { url: request.url, headers: request.headers, body };

  if (scenario === "pending") return;
  if (scenario === "disconnected") return request.socket.destroy();

  response.setHeader("Content-Type", "application/json");
  if (scenario === "partial-body") {
    response.writeHead(200);
    response.write('{"access_token":');
    return;
  }
  if (scenario === "unauthorized") {
    response.writeHead(401);
    response.end(JSON.stringify({ error: "Email atau password tidak valid." }));
    return;
  }
  response.end(JSON.stringify(loginResponse));
});

before(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  vite = await createViteServer({
    configFile: false,
    server: { middlewareMode: true, hmr: false },
    define: { "import.meta.env.VITE_AUTH_API_BASE_URL": JSON.stringify(baseUrl) },
  });
  auth = await vite.ssrLoadModule("/src/features/auth/api.ts");
  api = await vite.ssrLoadModule("/src/shared/api/http.ts");
});

after(async () => {
  await vite?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

test("login posts credentials to auth and returns the session", async () => {
  assert.deepEqual(await auth.login(credentials), loginResponse);
  assert.equal(lastRequest.url, "/api/v1/auth/login");
  assert.equal(lastRequest.headers["content-type"], "application/json");
  assert.equal(lastRequest.headers.authorization, undefined);
  assert.deepEqual(JSON.parse(lastRequest.body), credentials);
});

test("invalid credentials preserve the backend error", async () => {
  scenario = "unauthorized";
  await assert.rejects(auth.login(credentials), (error) => {
    assert.ok(error instanceof api.ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.message, "Email atau password tidak valid.");
    return true;
  });
});

// Uji batas waktu sebenarnya, termasuk body respons yang tidak selesai.
for (const stalledResponse of ["pending", "partial-body"]) {
  test(`login times out with a ${stalledResponse} response`, { timeout: 20_000 }, async () => {
    scenario = stalledResponse;
    await assert.rejects(auth.login(credentials), (error) => {
      assert.ok(error instanceof api.ApiError);
      assert.equal(error.status, 0);
      assert.match(error.message, /batas waktu/);
      assert.equal(error.payload.name, "TimeoutError");
      return true;
    });
  });
}

test("login can be retried successfully after a timeout", async () => {
  scenario = "success";
  assert.deepEqual(await auth.login(credentials), loginResponse);
});

test("connection failures are reported as connection errors", async () => {
  scenario = "disconnected";
  await assert.rejects(auth.login(credentials), (error) => {
    assert.equal(error.status, 0);
    assert.match(error.message, /Tidak dapat terhubung/);
    return true;
  });
});

test("a caller can still cancel a request with a timeout", async () => {
  scenario = "pending";
  const controller = new AbortController();
  const pending = api.createHttpClient(baseUrl).get("/health", {
    auth: false,
    signal: controller.signal,
    timeoutMs: 15_000,
  });
  controller.abort();
  await assert.rejects(pending, (error) => {
    assert.equal(error.status, 0);
    assert.equal(error.payload.name, "AbortError");
    assert.doesNotMatch(error.message, /batas waktu/);
    return true;
  });
});
