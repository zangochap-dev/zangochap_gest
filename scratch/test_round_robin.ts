import "dotenv/config";
import { Module } from "module";

// Mock next/headers for getSession() to run in terminal script
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === "next/headers") {
    return {
      cookies: async () => ({
        get: () => null,
        set: () => {},
        delete: () => {},
      }),
    };
  }
  return originalRequire.apply(this, arguments);
};

import prisma from "../lib/prisma";
import { createOrder } from "../modules/orders/actions/order-actions";

async function main() {
  console.log("🚀 Starting Round-Robin Lead Assignment Verification...\n");

  // 1. Find or create 3 test commercials
  const testEmails = [
    "rr_test_1@zangochap.in",
    "rr_test_2@zangochap.in",
    "rr_test_3@zangochap.in",
  ];

  for (let i = 0; i < testEmails.length; i++) {
    const email = testEmails[i];
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await prisma.user.create({
        data: {
          email,
          name: `Commercial RR Test ${i + 1}`,
          password: "testpassword",
          role: "COMMERCIAL",
        },
      });
      console.log(`✅ Created test commercial: ${email}`);
    } else {
      console.log(`ℹ️ Found existing test commercial: ${email}`);
    }
  }

  // Fetch ALL commercials sorted by ID asc to match the production query exactly
  const dbCommercials = await prisma.user.findMany({
    where: { role: 'COMMERCIAL' },
    orderBy: { id: 'asc' },
    select: { id: true, name: true }
  });

  console.log("\nCommercial order in DB (asc by ID):");
  dbCommercials.forEach((c, idx) => console.log(` [${idx}] ID: ${c.id} | Name: ${c.name}`));

  if (dbCommercials.length < 3) {
    throw new Error("Expected at least 3 commercials to run this test.");
  }

  // 2. Reset round-robin state
  await prisma.cmsContent.upsert({
    where: { key: "round_robin_state" },
    create: {
      key: "round_robin_state",
      data: { lastAssignedId: null },
    },
    update: {
      data: { lastAssignedId: null },
    },
  });
  console.log("\n🔄 Reset round-robin state cursor.");

  // Clean any previous test orders to avoid noise
  await prisma.order.deleteMany({
    where: {
      customerPhone: "9999999999",
    },
  });

  // 3. Test 1: Sequential assignments
  console.log("\n--- TEST 1: Sequential Order Creations ---");
  const orderIds: string[] = [];

  for (let i = 0; i < 3; i++) {
    const res = await createOrder({
      customerName: `Client Seq ${i + 1}`,
      customerPhone: "9999999999",
      customerLocation: "Abidjan",
      commune: "Cocody",
      items: [
        {
          name: "Product Seq",
          size: "M",
          color: "Red",
          qty: 1,
          price: 15000,
        },
      ],
      source: "public",
    });

    if (!res || !res.order) {
      throw new Error(`Failed to create order ${i + 1}`);
    }

    const createdOrder = await prisma.order.findUnique({
      where: { id: res.order.id },
    });
    orderIds.push(res.order.id);

    // Verify expected commercial
    const expectedCommercial = dbCommercials[i % dbCommercials.length];
    console.log(
      `Order ${i + 1}: Assigned lead = ${createdOrder?.commercialName} (ID: ${createdOrder?.commercialId}) | Expected = ${expectedCommercial.name}`
    );
    if (createdOrder?.commercialId !== expectedCommercial.id) {
      throw new Error(`Incorrect assignment! Expected ${expectedCommercial.name}, got ${createdOrder?.commercialName}`);
    }
  }
  console.log("✅ Test 1 Passed: Sequential assignment matches round-robin order perfectly!");

  // 4. Test 2: Concurrent assignments
  console.log("\n--- TEST 2: Concurrent Order Creations (Simulated Concurrency) ---");
  
  // Reset pointer again to test concurrency cleanly starting from index 0
  await prisma.cmsContent.update({
    where: { key: "round_robin_state" },
    data: { data: { lastAssignedId: null } },
  });

  // Launch 6 creations simultaneously
  console.log("Launching 6 concurrent orders...");
  const promises = Array.from({ length: 6 }).map((_, i) =>
    createOrder({
      customerName: `Client Concur ${i + 1}`,
      customerPhone: "9999999999",
      customerLocation: "Abidjan",
      commune: "Cocody",
      items: [
        {
          name: "Product Concur",
          size: "M",
          color: "Red",
          qty: 1,
          price: 15000,
        },
      ],
      source: "public",
    })
  );

  const results = await Promise.all(promises);
  console.log("All concurrent order creations finished.");

  // Fetch the created orders to verify assignments
  const concurrentOrders = await prisma.order.findMany({
    where: { id: { in: results.map((r) => r.order.id) } },
    orderBy: { createdAt: "asc" }, // Sorting by created date
  });

  // Verify sequence
  console.log("\nAssignments for concurrent orders:");
  const actualIds = concurrentOrders.map(o => o.commercialId);
  const expectedIds = Array.from({ length: 6 }).map((_, i) => dbCommercials[i % dbCommercials.length].id);

  concurrentOrders.forEach((o, idx) => {
    const expectedName = dbCommercials[idx % dbCommercials.length].name;
    console.log(` - Order Ref ${o.ref}: Assigned to ${o.commercialName} (ID: ${o.commercialId}) | Expected: ${expectedName}`);
    
    // Check history logs
    const history = o.history as any[];
    console.log(`   History Log: ${history?.[0]?.action}`);
    
    if (o.commercialId !== dbCommercials[idx % dbCommercials.length].id) {
      throw new Error(`Concurrency race condition detected at order index ${idx}! Expected ${expectedName}, but got ${o.commercialName}`);
    }
  });

  console.log("✅ Test 2 Passed: Round-robin distributes concurrent orders perfectly without race conditions or duplicates!");

  // 5. Test 3: Active Commercials Selection Rotation Filter
  console.log("\n--- TEST 3: Rotation Filter (Only Commercials 1 & 3 Active) ---");
  
  // Set active commercial list to only Commercial RR Test 1 and Commercial RR Test 3
  const activeTestCommercials = dbCommercials.filter(c => c.name.includes("Commercial RR Test 1") || c.name.includes("Commercial RR Test 3"));
  if (activeTestCommercials.length < 2) {
    throw new Error("Could not find at least 2 Commercial RR Test users to perform rotation filter test.");
  }
  const activeIds = activeTestCommercials.map(c => c.id);
  
  // Update state to set active ids
  await prisma.cmsContent.update({
    where: { key: "round_robin_state" },
    data: {
      data: {
        lastAssignedId: null,
        activeCommercialIds: activeIds
      }
    }
  });
  console.log(`Configured rotation filter with active IDs: [${activeTestCommercials.map(c => c.name).join(", ")}]`);

  // Perform 4 order creations and verify that they alternate only between Commercial 1 and 3
  for (let i = 0; i < 4; i++) {
    const res = await createOrder({
      customerName: `Client Filtered Seq ${i + 1}`,
      customerPhone: "9999999999",
      customerLocation: "Abidjan",
      commune: "Cocody",
      items: [
        {
          name: "Product Filtered Seq",
          size: "M",
          color: "Red",
          qty: 1,
          price: 15000,
        },
      ],
      source: "public",
    });

    const createdOrder = await prisma.order.findUnique({
      where: { id: res.order.id },
    });

    const expectedCommercial = activeTestCommercials[i % activeTestCommercials.length];
    console.log(
      `Order ${i + 1}: Assigned lead = ${createdOrder?.commercialName} (ID: ${createdOrder?.commercialId}) | Expected = ${expectedCommercial.name}`
    );
    if (createdOrder?.commercialId !== expectedCommercial.id) {
      throw new Error(`Rotation filter failed! Expected assignment to ${expectedCommercial.name}, got ${createdOrder?.commercialName}`);
    }
  }
  console.log("✅ Test 3 Passed: Active commercials rotation filter works perfectly! Skips inactive commercials.");

  // Reset active ids to default (empty) at the end of the test
  await prisma.cmsContent.update({
    where: { key: "round_robin_state" },
    data: {
      data: {
        lastAssignedId: null,
        activeCommercialIds: []
      }
    }
  });

  // 6. Clean up test data
  console.log("\n🧹 Cleaning up test orders...");
  await prisma.order.deleteMany({
    where: {
      customerPhone: "9999999999",
    },
  });
  console.log("✅ Cleanup complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("\n❌ Test failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
