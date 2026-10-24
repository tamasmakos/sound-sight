import { Suspense } from "react";
import { PracticeSession } from "@/components/PracticeSession";

export default function PracticePage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <PracticeLoader params={params} />
    </Suspense>
  );
}

async function PracticeLoader({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return <PracticeSession lessonId={lessonId} />;
}
