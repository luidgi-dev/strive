// app/[locale]/protected/loading.tsx
import React from "react";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
    </div>
  );
}