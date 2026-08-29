/* CONCORDVEST / Quiet Structure: compact architectural mark plus a disciplined wordmark for editorial navigation. */

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a
      href="/"
      className="group inline-flex items-center gap-3"
      aria-label="Concordvest home"
    >
      <span className="transition-transform duration-200 group-hover:-rotate-3 flex-shrink-0">
        <img
          src="/images/concordvestLogo.jpeg"
          alt="ConcordVest Logo"
          className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-md bg-white p-1"
        />
      </span>
      <span
        className={`text-[0.78rem] font-extrabold tracking-[0.3em] ${light ? "text-white" : "text-[#012770]"}`}
      >
        CONCORDVEST
      </span>
    </a>
  );
}
