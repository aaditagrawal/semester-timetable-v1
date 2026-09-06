import { classNames } from "@/ui.stylex";
import Link from "next/link";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className={classNames.notFound34}>
      <div className={classNames.notFound35}>
        <div className={classNames.notFound36}>
          <div className={classNames.notFound37}>
            <div className={classNames.notFound38}>404</div>

            <div className={classNames.notFound39}>
              <h1 className={classNames.notFound40}>Page Not Found</h1>
              <p className={classNames.notFound41}>
                The timetable you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
            </div>

            <div className={classNames.notFound42}>
              <Link href="/" className={classNames.notFound43}>
                <ArrowLeftIcon className={classNames.notFound44} />
                Go Back
              </Link>
              <Link href="/" className={classNames.notFound45}>
                <HomeIcon className={classNames.notFound46} />
                Home
              </Link>
            </div>
          </div>
        </div>

        <div className={classNames.notFound47}>
          <p className={classNames.notFound48}>MIT Manipal IT_CCE Timetable</p>
        </div>
      </div>
    </main>
  );
}
