import React from "react";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import { getHomeCmsContent } from "@/modules/cms/actions";
import { getMediaFiles } from "@/modules/media/actions";
import CmsClient from "./CmsClient";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CmsPage() {
  const user = await getSession();
  if (user?.role !== "admin") redirect("/zangochap-manager");

  const [content, categories, mediaFiles] = await Promise.all([
    getHomeCmsContent(),
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
    getMediaFiles(),
  ]);

  return (
    <>
      <Topbar title="CMS" subtitle="site public" />
      <CmsClient
        initialContent={content}
        categories={JSON.parse(JSON.stringify(categories))}
        mediaFiles={JSON.parse(JSON.stringify(mediaFiles))}
      />
    </>
  );
}
