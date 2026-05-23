"use server";

import prisma from "@/lib/prisma";
import { ensureAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { DEFAULT_HOME_CMS, HomeCmsContent, normalizeHomeCms } from "./types";

const HOME_KEY = "home";

export async function getHomeCmsContent(): Promise<HomeCmsContent> {
  try {
    const content = await prisma.cmsContent.findUnique({
      where: { key: HOME_KEY },
      select: { data: true },
    });

    return normalizeHomeCms(content?.data);
  } catch (error) {
    console.warn("Could not fetch CMS content (expected during build):", error instanceof Error ? error.message : "Unknown error");
    return normalizeHomeCms(null);
  }
}

export async function saveHomeCmsContent(data: HomeCmsContent) {
  const session = await ensureAuth(["admin"]);
  const clean = normalizeHomeCms(data);

  await prisma.cmsContent.upsert({
    where: { key: HOME_KEY },
    update: {
      data: clean,
      updatedBy: session.email,
    },
    create: {
      key: HOME_KEY,
      data: clean,
      updatedBy: session.email,
    },
  });

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/sitemap.xml");
  revalidatePath("/zangochap-manager/admin/cms");
  return { success: true };
}

export async function resetHomeCmsContent() {
  const session = await ensureAuth(["admin"]);

  await prisma.cmsContent.upsert({
    where: { key: HOME_KEY },
    update: {
      data: DEFAULT_HOME_CMS,
      updatedBy: session.email,
    },
    create: {
      key: HOME_KEY,
      data: DEFAULT_HOME_CMS,
      updatedBy: session.email,
    },
  });

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/sitemap.xml");
  revalidatePath("/zangochap-manager/admin/cms");
  return { success: true };
}
