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
