/* CONCORDVEST / Quiet Structure: compact architectural mark plus a disciplined wordmark for editorial navigation. */

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="/" className="group inline-flex items-center gap-3" aria-label="Concordvest home">
      <span className={`grid h-11 w-11 place-items-center p-1.5 transition-transform duration-200 group-hover:-rotate-3 sm:h-12 sm:w-12 ${light ? "bg-white/10" : "bg-white"}`}>
        <svg viewBox="0 0 40 40" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="2" fill="none" className={`${light ? "text-white" : "text-[#012770]"}`} />
          <path d="M12 28V12h4v12h12v4H12z" fill="currentColor" className={`${light ? "text-white" : "text-[#012770]"}`} />
        </svg>
      </span>
      <span className={`text-[0.78rem] font-extrabold tracking-[0.3em] ${light ? "text-white" : "text-[#012770]"}`}>
        CONCORDVEST
      </span>
    </a>
  );
}
