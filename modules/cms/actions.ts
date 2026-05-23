"use server";

import prisma from "@/lib/prisma";
import { ensureAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { DEFAULT_HOME_CMS, HomeCmsContent, normalizeHomeCms } from "./types";

const HOME_KEY = "home";

export async function getHomeCmsContent(): Promise<HomeCmsContent> {
  const content = await prisma.cmsContent.findUnique({
    where: { key: HOME_KEY },
    select: { data: true },
  });

  return normalizeHomeCms(content?.data);
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
  revalidatePath("/zangochap-manager/admin/cms");
  return { success: true };
}
