"use client";

import { Suspense } from "react";
import { CourseApp } from "@/components/CourseApp";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <CourseApp />
    </Suspense>
  );
}
