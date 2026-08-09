import { notFound } from "next/navigation";

import { Dashboard } from "../page";

export const dynamic = "force-dynamic";

export default function ReviewPage() {
  if (process.env.ENABLE_REVIEW_MODE !== "true") {
    notFound();
  }

  return <Dashboard forcedReview />;
}
