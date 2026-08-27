/* CONCORDVEST / Quiet Structure: compact architectural mark plus a disciplined wordmark for editorial navigation. */
const markUrl = "/manus-storage/concordvest-mark_3c9db8ed.png";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="/" className="group inline-flex items-center gap-3" aria-label="Concordvest home">
      <span className="grid h-11 w-11 place-items-center bg-white p-1.5 transition-transform duration-200 group-hover:-rotate-3 sm:h-12 sm:w-12">
        <img src={markUrl} alt="" className="h-full w-full object-contain" />
      </span>
      <span className={`text-[0.78rem] font-extrabold tracking-[0.3em] ${light ? "text-white" : "text-[#012770]"}`}>
        CONCORDVEST
      </span>
    </a>
  );
}
