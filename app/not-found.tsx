import Link from "next/link";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card text-card-foreground ring-foreground/10 ring-1 overflow-hidden">
          <div className="px-4 py-12 flex flex-col items-center text-center gap-6">
            <div className="text-muted-foreground text-xs font-mono tracking-widest uppercase">
              404
            </div>
            
            <div className="flex flex-col gap-2 items-center">
              <h1 className="text-2xl font-medium">Page Not Found</h1>
              <p className="text-muted-foreground text-sm max-w-[280px]">
                The timetable you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
            </div>

            <div className="flex gap-3 mt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 text-xs font-medium group/button"
              >
                <ArrowLeftIcon className="w-4 h-4 group-hover/button:-translate-x-0.5 transition-transform" />
                Go Back
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground [a]:hover:bg-primary/80 h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 text-xs font-medium"
              >
                <HomeIcon className="w-4 h-4" />
                Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-xs">
            MIT Manipal CCE-B Timetable
          </p>
        </div>
      </div>
    </main>
  );
}
