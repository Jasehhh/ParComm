import { Wordmark } from "@/components/Wordmark";

/** Full-page branded loader used while auth or the first Firestore snapshot resolves. */
export function LoadingState({ message = "Loading" }: { message?: string }) {
  return (
    <main className="bg-sand-50 flex min-h-screen w-full flex-col items-center justify-center gap-4 p-6">
      <Wordmark size="lg" />
      <div className="bg-sand-200 h-1 w-40 overflow-hidden rounded-full">
        <div className="bg-brand-400 pc-skeleton h-full w-full rounded-full" />
      </div>
      <p className="text-ink-500 text-sm font-medium" role="status">
        {message}
      </p>
    </main>
  );
}
