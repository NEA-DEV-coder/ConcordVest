/* CONCORDVEST / Quiet Structure: compact architectural mark plus a disciplined wordmark for editorial navigation. */
import LogoImg from "../../public/concordvestLogo.jpeg";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a
      href="/"
      className="group inline-flex items-center gap-3"
      aria-label="Concordvest home"
    >
      <span
        className={`grid h-11 w-11 place-items-center p-1.5 transition-transform duration-200 group-hover:-rotate-3 sm:h-12 sm:w-12 ${light ? "bg-white/10" : "bg-white"}`}
      >
        <img src={LogoImg} />
      </span>
      <span
        className={`text-[0.78rem] font-extrabold tracking-[0.3em] ${light ? "text-white" : "text-[#012770]"}`}
      >
        CONCORDVEST
      </span>
    </a>
  );
}
