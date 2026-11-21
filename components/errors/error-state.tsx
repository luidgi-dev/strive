import type { ReactNode } from "react";

type Props = {
  /** Status caption above the title, e.g. "404". Not translated. */
  code: string;
  title: string;
  body: string;
  /** Decorative icon element, e.g. `<Compass />`. */
  icon: ReactNode;
  /** One primary action, optionally followed by a secondary link. */
  children: ReactNode;
};

/**
 * Shared layout for every error page (404, 500, route errors): calm, centered,
 * one primary action. No hooks, so Server and Client Components can both use it.
 * Never pass it a raw error message.
 */
export function ErrorState({ code, title, body, icon, children }: Props) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-2 pb-24 text-center">
      <div
        aria-hidden
        className="flex size-16 items-center justify-center rounded-2xl bg-accent text-muted-foreground [&_svg]:size-7 [&_svg]:stroke-[1.5]"
      >
        {icon}
      </div>
      <p className="-mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {code}
      </p>
      <h1 className="max-w-[280px] font-heading text-[22px] font-bold leading-tight tracking-tight text-foreground">
        {title}
      </h1>
      <p className="max-w-[280px] text-[13.5px] leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="mt-2 flex flex-col items-center gap-1">{children}</div>
    </div>
  );
}
