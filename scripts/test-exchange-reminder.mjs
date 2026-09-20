// Isolated API permission/filter tests. No real database or network.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
let session = null;
let calls = 0;
let fail = false;
const rows = [
  { key: "order-exchange:one", commercialId: "mine", status: "PENDING" },
  { key: "order-exchange:two", commercialId: "other", status: "PENDING" },
  { key: "order-exchange:three", commercialId: "mine", status: "APPROVED" },
  { key: "order-exchange:four", commercialId: "mine", status: "REJECTED" },
  { key: "order-reprogramming:five", commercialId: "mine", status: "PENDING" },
];
const source = ts.transpileModule(fs.readFileSync("app/api/order-exchange-reminder/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const scope = { exports: {}, require: name => {
  if (name === "next/server") return { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200, headers: options.headers }) } };
  if (name === "@/modules/auth/actions") return { getSession: async () => session };
  if (name === "@/modules/orders/types/exchange") return { EXCHANGE_PREFIX: "order-exchange:" };
  if (name === "@/lib/prisma") return { __esModule: true, default: { cmsContent: { count: async ({ where }) => {
    calls++;
    if (fail) throw new Error("private error");
    return rows.filter(row => row.key.startsWith(where.key.startsWith) && where.AND.every(filter => row[filter.data.path[0]] === filter.data.equals)).length;
  } } } };
  throw new Error(name);
} };
vm.runInNewContext(source, scope);
assert.equal((await scope.exports.GET()).status, 401);
for (const role of ["admin", "developer", "packing"]) {
  session = { id: "mine", role };
  assert.equal((await scope.exports.GET()).status, 403);
}
assert.equal(calls, 0);
session = { id: "mine", role: "commercial" };
let response = await scope.exports.GET();
assert.equal(response.body.count, 1);
assert.equal(response.headers["Cache-Control"], "private, no-store");
assert.deepEqual(Object.keys(response.body), ["count"]);
rows[0].status = "APPROVED";
assert.equal((await scope.exports.GET()).body.count, 0);
fail = true;
response = await scope.exports.GET();
assert.equal(response.status, 503);
assert.ok(!JSON.stringify(response).includes("private error"));
console.log("PASS: reminder requires commercial session, counts only own pending exchanges, clears after decision, no cache or customer data, safe failure.");
