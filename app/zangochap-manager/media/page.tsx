import { getMediaFiles } from "@/modules/media/actions";
import MediaClient from "./MediaClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const files = await getMediaFiles();

  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-[#6B4838]">Chargement de la médiathèque...</div>}>
      <MediaClient initialFiles={files} />
    </Suspense>
  );
}
