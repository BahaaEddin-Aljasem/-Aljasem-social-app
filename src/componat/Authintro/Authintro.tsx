const stats = [
  { value: "2012", label: "Founded" },
  { value: "40K+", label: "Graduates" },
  { value: "50+", label: "Partner Companies" },
  { value: "5", label: "Branches" },
  { value: "20", label: "Diplomas Available" },
];

export default function Authintro() {
  return (
    <section className="w-full max-w-xl">
      <div className="mb-4 overflow-hidden rounded-2xl border border-[#d1dcff] bg-[#0d2f93] shadow-[0_8px_22px_rgba(13,47,147,0.25)]">
        <div className="relative flex min-h-[180px] items-center justify-center px-6 py-8">
          <div className="absolute -top-10 right-5 size-28 rounded-full bg-[#2f6eff]/35 blur-2xl" />
          <div className="absolute -bottom-12 left-5 size-32 rounded-full bg-[#63a5ff]/35 blur-2xl" />
          <div className="absolute inset-0 bg-linear-to-b from-white/[0.03] to-transparent" />
          <div className="relative text-center">
            <p className="text-[50px] leading-none font-black tracking-[0.08em] text-white drop-shadow-[0_6px_14px_rgba(0,0,0,0.28)]">ROUTE</p>
          </div>
        </div>
        <div className="border-t border-white/15 bg-white/12 px-5 py-3">
          <p className="text-center text-sm font-medium text-[#e6eeff]">
            Social helps you connect, share, and stay close to your friends.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#d7e0ff] bg-white p-5 shadow-[0_6px_18px_rgba(22,48,120,0.08)]">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#002a8c]">About Route Academy</h2>
        <h3 className="mt-2 text-lg font-bold text-[#0b1530]">Egypt's Leading IT Training Center Since 2012</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Route Academy is the premier IT training center in Egypt, established in 2012. We specialize in delivering
          high-quality training courses in programming, web development, and application development. We've identified
          the unique challenges people may face when learning new technology and made efforts to provide strategies to
          overcome them.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-[#c9d3fb] bg-[#f0f5ff] px-3 py-2">
              <p className="text-base font-bold text-[#002a8c]">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
