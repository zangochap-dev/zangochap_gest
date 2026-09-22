// Isolated validation, permission and document tests: no real database/network.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const scope = { exports: {}, Buffer, Request, Response, File, URL, Uint8Array, Date, console, require: name => name in mocks ? mocks[name] : require(name) };
  vm.runInNewContext(source, scope, { filename: path });
  return scope.exports;
}
const types = load("modules/personnel/types.ts");
const valid = { ...types.emptyPersonnel(), lastName: "Test", firstName: "Livreur", matricule: "TEST-001" };
assert.equal(types.personnelCompletion(types.emptyPersonnel(), []).percent, 0);
const initialCompletion = types.personnelCompletion(valid, []);
assert.equal(initialCompletion.filled, 3);
assert.equal(types.personnelCompletion(valid, [{ kind: "portrait" }, { kind: "portrait" }]).filled, 4, "A document kind counts once");
assert.equal(types.personnelCompletion({ ...valid, lastName: "  " }, []).filled, 2);
assert.equal(types.personnelCompletion({ ...valid, birthDate: "2099-01-01" }, []).filled, 3, "Invalid date does not count");
assert.ok(types.personnelCompletion({ ...valid, vehicleType: "Moto" }, []).total > initialCompletion.total);
assert.equal(types.personnelCompletion({ ...valid, status: "Parti" }, []).total, initialCompletion.total + 2);
assert.equal(types.personnelCompletion({ ...valid, phone2: "0000000000" }, []).filled, 3, "Optional secondary phone excluded");
const completed = types.emptyPersonnel();
for (const section of types.sections) for (const field of section.fields) {
  completed[field[0]] = field[2] === "date" ? "2000-01-01" : field[2] === "tel" ? "0000000000" : field[2] === "select" ? field[4] : "Test";
}
const fullProgress = types.personnelCompletion(completed, Object.keys(types.documentKinds).map(kind => ({ kind })));
assert.equal(types.PersonnelSchema.safeParse(completed).success, true);
assert.equal(fullProgress.percent, 100);
assert.equal(fullProgress.missing.length, 0);
assert.equal(types.PersonnelSchema.safeParse(valid).success, true);
for (const changes of [{ lastName: "" }, { firstName: "" }, { birthDate: "2099-01-01" }, { birthDate: "2000-02-31" }, { phone: "abcd" }, { sex: "Invalid" }, { vehicleType: "Invalid" }, { status: "Parti" }, { startDate: "2026-02-01", departureDate: "2026-01-01" }, { identityIssued: "2026-02-01", identityExpires: "2026-01-01" }, { unknown: "field" }]) {
  assert.equal(types.PersonnelSchema.safeParse({ ...valid, ...changes }).success, false);
}
assert.equal(types.PersonnelSchema.safeParse({ ...valid, identityExpires: "2020-01-01" }).success, true, "Expired documents may be recorded without inventing dates");
const files = load("modules/personnel/files.ts");
await assert.rejects(() => files.preparePersonnelFile(new Uint8Array(), "image/jpeg", true));
await assert.rejects(() => files.preparePersonnelFile(new Uint8Array(5 * 1024 * 1024 + 1), "image/jpeg", true));
await assert.rejects(() => files.preparePersonnelFile(Buffer.from("<svg/>"), "image/svg+xml", true));
await assert.rejects(() => files.preparePersonnelFile(Buffer.from("fake"), "image/jpeg", true));
await assert.rejects(() => files.preparePersonnelFile(Buffer.from("fake"), "application/pdf", false));
await assert.rejects(() => files.preparePersonnelFile(Buffer.from("%PDF-1.7 test"), "application/pdf", true));
assert.equal((await files.preparePersonnelFile(Buffer.from("%PDF-1.7 test"), "application/pdf", false)).mimeType, "application/pdf");
const png = await require("sharp")({ create: { width: 2, height: 2, channels: 3, background: "white" } }).png().toBuffer();
assert.equal((await files.preparePersonnelFile(png, "image/png", true)).mimeType, "image/jpeg");

let session = { id: "admin-test", role: "admin" };
let profile = null;
let reads = 0;
let writes = 0;
let targetRole = "LIVREUR";
const db = {
  user: { findUnique: async () => { reads++; return { id: "rider-test", name: "Test", role: targetRole, phone: null, phone2: null }; } },
  riderPersonnelProfile: {
    findUnique: async () => { reads++; return profile; },
    create: async ({ data }) => { writes++; if (profile) throw { code: "P2002" }; profile = { ...data, id: "profile-test", version: 1, updatedAt: new Date(), documents: [] }; },
    updateMany: async ({ where, data }) => { if (profile?.version !== where.version) return { count: 0 }; writes++; profile = { ...profile, ...data, version: profile.version + 1 }; return { count: 1 }; },
  },
  riderPersonnelDocument: {
    findUnique: async () => { reads++; return { content: Buffer.from("private-file"), mimeType: "application/pdf", profile: { user: { role: targetRole } } }; },
    create: async ({ data }) => { writes++; return { id: "doc-test", kind: data.kind, mimeType: data.mimeType, createdAt: new Date() }; },
  },
  $transaction: async callback => callback(db),
};
const auth = { ensureAuth: async () => { if (!session || !["admin", "developer"].includes(session.role)) throw new Error("Accès refusé"); return session; } };
const actions = load("modules/personnel/actions.ts", { "@/lib/prisma": db, "@/lib/auth": auth, "./types": types, "next/cache": { revalidatePath: () => {} } });
for (const role of ["commercial", "livreur", "packing"]) {
  session = { id: "other", role };
  await assert.rejects(() => actions.getRiderPersonnel("rider-test"));
  assert.equal((await actions.saveRiderPersonnel("rider-test", valid, 0)).success, false);
}
assert.equal(reads, 0); assert.equal(writes, 0);
session = { id: "admin-test", role: "admin" };
assert.equal((await actions.saveRiderPersonnel("rider-test", valid, 0)).success, true);
assert.equal((await actions.saveRiderPersonnel("rider-test", valid, 1)).version, 2);
assert.equal((await actions.saveRiderPersonnel("rider-test", valid, 1)).success, false, "Concurrent edits cannot silently overwrite");
assert.equal((await actions.saveRiderPersonnel("rider-test", valid, 0)).success, false, "Duplicate creation reported");
targetRole = "CUSTOMER";
assert.equal((await actions.saveRiderPersonnel("rider-test", valid, 2)).success, false);
await assert.rejects(() => actions.getRiderPersonnel("rider-test"));
targetRole = "DEVELOPER";
assert.equal((await actions.saveRiderPersonnel("rider-test", valid, 2)).success, false);
await assert.rejects(() => actions.getRiderPersonnel("rider-test"));
for (const role of Object.keys(types.personnelRoles).filter(role => role !== "DEVELOPER")) {
  targetRole = role;
  assert.equal((await actions.getRiderPersonnel("rider-test")).role, role);
  assert.equal((await actions.saveRiderPersonnel("rider-test", valid, profile.version)).success, true);
}
profile.data.vehicleType = "Moto";
targetRole = "COMMERCIAL";
assert.equal((await actions.saveRiderPersonnel("rider-test", { ...valid, vehicleType: "Voiture" }, profile.version)).success, true);
assert.equal(profile.data.vehicleType, "Moto", "Changing role preserves historical rider data");
const commercialProgress = types.personnelCompletion(completed, [{ kind: "portrait" }, { kind: "identity" }], "COMMERCIAL");
assert.equal(commercialProgress.percent, 100);
assert.equal(types.personnelSections("COMMERCIAL").length, 5);
assert.equal(types.personnelSections("LIVREUR").length, 6);
assert.ok(commercialProgress.total < fullProgress.total);
assert.equal(types.allowedPersonnelDocument("COMMERCIAL", "license"), false);
assert.equal(types.allowedPersonnelDocument("LIVREUR", "license"), true);
targetRole = "LIVREUR";
session = { id: "dev-test", role: "developer" };
assert.equal((await actions.getRiderPersonnel("rider-test")).version, profile.version);

const mocks = { "@/modules/auth/actions": { getSession: async () => session }, "@/lib/prisma": db,
  "@/modules/personnel/types": types, "@/modules/personnel/files": files,
  "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
};
const download = load("app/api/personnel/documents/[id]/route.ts", mocks);
const upload = load("app/api/personnel/riders/[userId]/documents/route.ts", mocks);
const context = { params: Promise.resolve({ id: "doc-test", userId: "rider-test" }) };
for (const value of [null, { role: "commercial" }, { role: "livreur" }]) {
  session = value;
  const before = reads;
  assert.equal((await download.GET(null, context)).status, 403);
  assert.equal((await upload.POST(new Request("https://example.test"), context)).status, 403);
  assert.equal(reads, before, "Unauthorized requests never read file bytes");
}
session = { id: "admin-test", role: "admin" };
const response = await download.GET(null, context);
assert.equal(response.status, 200);
assert.equal(response.headers.get("cache-control"), "private, no-store");
assert.match(response.headers.get("content-disposition"), /attachment/);
assert.equal(response.headers.get("x-content-type-options"), "nosniff");
assert.equal((await upload.POST(new Request("https://example.test", { method: "POST", headers: { origin: "https://evil.test", host: "example.test" } }), context)).status, 403);
const form = new FormData();
form.set("kind", "portrait"); form.set("file", new File([png], "photo.png", { type: "image/png" }));
const multipart = new Request("https://example.test", { method: "POST", body: form });
const raw = await multipart.arrayBuffer();
const uploaded = await upload.POST(new Request("https://example.test", { method: "POST", body: raw, headers: {
  host: "example.test", origin: "https://example.test", "content-type": multipart.headers.get("content-type"), "content-length": String(raw.byteLength),
} }), context);
assert.equal(uploaded.status, 200);
const uploadResult = await uploaded.json();
assert.equal(uploadResult.document.kind, "portrait");
assert.equal(uploadResult.document.content, undefined, "Upload response contains metadata only");
const withoutLength = await upload.POST(new Request("https://example.test", { method: "POST", body: raw, headers: {
  host: "example.test", origin: "https://example.test", "content-type": multipart.headers.get("content-type"),
} }), context);
assert.equal(withoutLength.status, 200, "Bounded reader supports proxies without Content-Length");
console.log("PASS: personnel validation, dates/phones/status, private file formats/limits, roles before data access, optimistic updates, duplicate creation, authenticated downloads/no-store and upload origin checks. Mocked DB only.");

for (const role of ["CUSTOMER", "DEVELOPER"]) {
  targetRole = role;
  assert.equal((await download.GET(null, context)).status, 404);
}
targetRole = "COMMERCIAL";
const staffUpload = async kind => {
  const body = new FormData(); body.set("kind", kind); body.set("file", new File([png], "test.png", { type: "image/png" }));
  return upload.POST(new Request("https://example.test", { method: "POST", body, headers: { host: "example.test", origin: "https://example.test" } }), context);
};
assert.equal((await staffUpload("portrait")).status, 200);
for (const kind of ["license", "registration", "insurance", "vehicle"]) assert.equal((await staffUpload(kind)).status, 400);
console.log("PASS: team roles, customer exclusion, developer profile isolation, role-specific completion and uploads, preserved rider history.");

const summary = load("modules/personnel/summary.ts", { "./types": types });
assert.equal(summary.personnelSummary("COMMERCIAL", null).percent, 0);
assert.equal(summary.personnelSummary("COMMERCIAL", { data: {}, documents: [] }), null);
assert.equal(summary.personnelSummary("COMMERCIAL", { data: completed, documents: [{ kind: "identity" }, { kind: "portrait" }] }).percent, 100);
console.log("PASS: saved personnel summaries, missing profiles and invalid profiles.");
