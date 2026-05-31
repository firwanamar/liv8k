import React, { useState, useEffect, useMemo, useRef } from "react";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Wallet, TrendingDown, TrendingUp, Landmark, Code2, BarChart3, CalendarDays, Users, PlusCircle, ListChecks, Pencil, Activity } from "lucide-react";

const storage = {
  get: (k) => { try { const v = localStorage.getItem(k); return v == null ? null : { value: v }; } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
};

const EXPENSE_FIELDS = [
  { key: "ads", label: "رسوم الإعلانات" },
  { key: "salaries", label: "رواتب الموظفين" },
  { key: "whatsapp", label: "اشتراك الواتس اب" },
  { key: "loan", label: "قسط القرض" },
  { key: "codes", label: "دفعة الأكواد" },
  { key: "emergency", label: "دفعات طارئة" },
];
const ALL_FIELDS = ["income", ...EXPENSE_FIELDS.map((f) => f.key)];

const SEED = [
  { month: "شهر 10 - 2024", income: 128000, ads: 48000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 0,     emergency: 0 },
  { month: "شهر 9 - 2024",  income: 133000, ads: 42000, salaries: 10000, whatsapp: 0,    loan: 20000, codes: 0,     emergency: 0 },
  { month: "شهر 11 - 2024", income: 133000, ads: 37000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 0,     emergency: 14000 },
  { month: "شهر 12 - 2024", income: 100000, ads: 27000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 0,     emergency: 0 },
  { month: "شهر 1 - 2025",  income: 116000, ads: 31000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 0,     emergency: 5800 },
  { month: "شهر 2 - 2025",  income: 139000, ads: 41000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 0,     emergency: 0 },
  { month: "شهر 3 - 2025",  income: 151000, ads: 45000, salaries: 11000, whatsapp: 2200, loan: 20000, codes: 0,     emergency: 0 },
  { month: "شهر 4 - 2025",  income: 151000, ads: 39000, salaries: 10000, whatsapp: 2200, loan: 20000, codes: 0,     emergency: 0 },
  { month: "شهر 6 - 2025",  income: 130000, ads: 34000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 15000, emergency: 0 },
  { month: "شهر 7 - 2025",  income: 100000, ads: 32000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 0,     emergency: 0 },
  { month: "شهر 8 - 2025",  income: 200000, ads: 60000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 15000, emergency: 3300 },
  { month: "شهر 9 - 2025",  income: 215000, ads: 52000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 15000, emergency: 0 },
  { month: "شهر 10 - 2025", income: 170000, ads: 45000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 15000, emergency: 0 },
  { month: "شهر 11 - 2025", income: 125000, ads: 45000, salaries: 10000, whatsapp: 2000, loan: 0,     codes: 0,     emergency: 0 },
  { month: "شهر 12 - 2025", income: 130000, ads: 32000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 15000, emergency: 0 },
  { month: "شهر 1 - 2026",  income: 144000, ads: 35000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 15000, emergency: 29000 },
  { month: "شهر 2 - 2026",  income: 92000,  ads: 0,     salaries: 6500,  whatsapp: 0,    loan: 0,     codes: 15000, emergency: 0 },
  { month: "شهر 3 - 2026",  income: 144000, ads: 35000, salaries: 10000, whatsapp: 2000, loan: 20000, codes: 15000, emergency: 0 },
  { month: "شهر 4 - 2026",  income: 190000, ads: 46000, salaries: 6000,  whatsapp: 0,    loan: 20000, codes: 15000, emergency: 16000 },
  { month: "شهر 5 - 2026",  income: 185000, ads: 41250, salaries: 12500, whatsapp: 0,    loan: 20000, codes: 15000, emergency: 11250 },
].map((r, i) => ({ id: `seed-${i}`, ...r }));

const SEED_MONTHS = Object.fromEntries(SEED.map((r) => [r.id, r.month]));
const SEED_PARTNERS = [{ id: "p1", name: "أحمد", share: 50 }, { id: "p2", name: "طلال", share: 50 }];

const REC_KEY = "triohub_accounts_records_v2";
const OLD_KEY = "triohub_accounts_records_v1";
const PARTNERS_KEY = "triohub_partners_v1";

const CARD_ICONS = { blue: Wallet, amber: TrendingDown, purple: Landmark, rose: Code2, teal: BarChart3, slate: CalendarDays };
const METRICS = [
  { key: "net", label: "صافي الربح", color: "#7c5cfc" },
  { key: "income", label: "الدخل", color: "#22c55e" },
  { key: "expenses", label: "المصاريف", color: "#f59e0b" },
];

const sumExpenses = (r) => EXPENSE_FIELDS.reduce((a, f) => a + (Number(r[f.key]) || 0), 0);
const netProfit = (r) => (Number(r.income) || 0) - sumExpenses(r);
const metricVal = (r, k) => (k === "net" ? netProfit(r) : k === "income" ? Number(r.income) || 0 : sumExpenses(r));
const fmt = (n) => (Number(n) || 0).toLocaleString("en-US");
const parseMY = (label) => {
  const nums = (String(label).match(/\d+/g) || []).map(Number);
  return { m: nums.find((n) => n >= 1 && n <= 12) ?? nums[0] ?? null, y: nums.find((n) => n > 31) ?? null };
};
const shortMonth = (label) => String(label).replace(/\s*-?\s*\d{4}\s*$/, "").trim();

const migrate = (list) =>
  list.map((r) => {
    const { installment, ...rest } = r;
    const month = SEED_MONTHS[rest.id] || rest.month;
    if (installment !== undefined && rest.loan === undefined && rest.codes === undefined) {
      const v = Number(installment) || 0;
      const loan = v >= 20000 ? 20000 : 0;
      return { ...rest, month, loan, codes: v - loan };
    }
    return { ...rest, month, loan: Number(rest.loan) || 0, codes: Number(rest.codes) || 0 };
  });

const emptyForm = () => ALL_FIELDS.reduce((a, k) => ({ ...a, [k]: "" }), { month: "" });

function MonthPicker({ records, period, onChange }) {
  const [open, setOpen] = useState(false);
  const years = [...new Set(records.map((r) => parseMY(r.month).y).filter(Boolean))].sort((a, b) => a - b);
  const [py, setPy] = useState(years[years.length - 1] || new Date().getFullYear());
  const current = period === "all" ? "كل المدة" : records.find((r) => r.id === period)?.month?.trim() || "اختر";
  const recForM = (m) => records.find((r) => { const p = parseMY(r.month); return p.y === py && p.m === m; });
  return (
    <div className="th-picker">
      <button className="th-picker-btn" onClick={() => setOpen((o) => !o)}>
        <span className="th-picker-label"><CalendarDays size={17} strokeWidth={2.2} /> {current}</span><span className="caret">▾</span>
      </button>
      {open && (
        <>
          <div className="th-pick-backdrop" onClick={() => setOpen(false)} />
          <div className="th-pick-pop">
            <button className={`th-pick-all ${period === "all" ? "on" : ""}`} onClick={() => { onChange("all"); setOpen(false); }}>كل المدة (كل الأشهر)</button>
            <div className="th-pick-ynav">
              <button onClick={() => setPy((y) => y - 1)}>‹</button>
              <span>{py}</span>
              <button onClick={() => setPy((y) => y + 1)}>›</button>
            </div>
            <div className="th-pick-grid">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const rec = recForM(m);
                const active = rec && rec.id === period;
                return (
                  <button key={m} disabled={!rec} className={`th-pick-m ${active ? "on" : ""} ${!rec ? "off" : ""}`}
                    onClick={() => { if (rec) { onChange(rec.id); setOpen(false); } }}>
                    {m}{rec && <i />}
                  </button>
                );
              })}
            </div>
            <p className="th-pick-hint">الشهور اللي عليها نقطة بنفسجية فيها بيانات</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [records, setRecords] = useState(null);
  const [partners, setPartners] = useState(SEED_PARTNERS);
  const [period, setPeriod] = useState("all");
  const [metric, setMetric] = useState("net");
  const [chartRange, setChartRange] = useState("recent");
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editingPartners, setEditingPartners] = useState(false);
  const [saved, setSaved] = useState(true);
  const recFirst = useRef(true);
  const partFirst = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        let data = null;
        try { const r = await storage.get(REC_KEY); data = r ? JSON.parse(r.value) : null; } catch (e) {}
        if (!(Array.isArray(data) && data.length)) {
          try { const o = await storage.get(OLD_KEY); const od = o ? JSON.parse(o.value) : null; if (Array.isArray(od) && od.length) data = od; } catch (e) {}
        }
        const finalRecs = Array.isArray(data) && data.length ? migrate(data) : SEED;
        setRecords(finalRecs);
        if (finalRecs.length) setPeriod(finalRecs[finalRecs.length - 1].id);
      } catch (e) { setRecords(SEED); }
      try { const p = await storage.get(PARTNERS_KEY); const pd = p ? JSON.parse(p.value) : null; if (Array.isArray(pd) && pd.length) setPartners(pd); } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (records === null) return;
    if (recFirst.current) { recFirst.current = false; return; }
    setSaved(false);
    (async () => { try { await storage.set(REC_KEY, JSON.stringify(records)); setSaved(true); } catch (e) {} })();
  }, [records]);

  useEffect(() => {
    if (partFirst.current) { partFirst.current = false; return; }
    (async () => { try { await storage.set(PARTNERS_KEY, JSON.stringify(partners)); } catch (e) {} })();
  }, [partners]);

  const view = useMemo(() => (period === "all" ? records || [] : (records || []).filter((r) => r.id === period)), [records, period]);

  const totals = useMemo(() => {
    const income = view.reduce((a, r) => a + (Number(r.income) || 0), 0);
    const expenses = view.reduce((a, r) => a + sumExpenses(r), 0);
    const net = income - expenses;
    return {
      income, expenses, net,
      avg: view.length ? Math.round(net / view.length) : 0,
      count: view.length,
      byField: ALL_FIELDS.reduce((a, k) => ({ ...a, [k]: view.reduce((s, r) => s + (Number(r[k]) || 0), 0) }), {}),
    };
  }, [view]);

  const shareSum = partners.reduce((a, p) => a + (Number(p.share) || 0), 0) || 1;
  const periodLabel = period === "all" ? "كل المدة" : (records || []).find((r) => r.id === period)?.month?.trim() || "";

  const comparison = useMemo(() => {
    const recs = records || [];
    const idx = period === "all" ? recs.length - 1 : recs.findIndex((r) => r.id === period);
    if (idx <= 0) return null;
    const cur = netProfit(recs[idx]);
    const prev = netProfit(recs[idx - 1]);
    const diff = cur - prev;
    const pct = prev !== 0 ? Math.round((diff / Math.abs(prev)) * 100) : null;
    return { diff, pct, prevMonth: recs[idx - 1].month.trim() };
  }, [records, period]);

  const chartYears = useMemo(() => [...new Set((records || []).map((r) => parseMY(r.month).y).filter(Boolean))].sort((a, b) => b - a), [records]);
  const activeMetric = METRICS.find((m) => m.key === metric);
  const chartRecords = useMemo(() => {
    if (chartRange === "recent") return (records || []).slice(-6);
    return (records || []).filter((r) => parseMY(r.month).y === chartRange);
  }, [records, chartRange]);
  const chartData = chartRecords.map((r) => ({ name: shortMonth(r.month), value: metricVal(r, metric) }));

  const liveNet = netProfit({ income: form.income, ...EXPENSE_FIELDS.reduce((a, f) => ({ ...a, [f.key]: form[f.key] }), {}) });
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.month.trim()) return;
    const rec = { month: form.month, ...ALL_FIELDS.reduce((a, k) => ({ ...a, [k]: Number(form[k]) || 0 }), {}) };
    setRecords((rs) => [...(rs || []), { id: `r-${Date.now()}`, ...rec }]);
    setForm(emptyForm());
  };
  const edit = (r) => { setEditingId(r.id); setEditForm({ id: r.id, month: r.month, ...ALL_FIELDS.reduce((a, k) => ({ ...a, [k]: String(r[k] ?? "") }), {}) }); };
  const setEField = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));
  const saveEdit = () => {
    if (!editForm || !editForm.month.trim()) return;
    const rec = { month: editForm.month, ...ALL_FIELDS.reduce((a, k) => ({ ...a, [k]: Number(editForm[k]) || 0 }), {}) };
    setRecords((rs) => rs.map((r) => (r.id === editingId ? { ...r, ...rec } : r)));
    setEditingId(null); setEditForm(null);
  };
  const cancelEdit = () => { setEditingId(null); setEditForm(null); };
  const remove = (id) => setRecords((rs) => rs.filter((r) => r.id !== id));
  const resetAll = () => { if (window.confirm("هترجّع كل البيانات للأصل اللي من الاكسل؟")) { setEditingId(null); setForm(emptyForm()); setRecords(SEED); } };

  const addPartner = () => setPartners((ps) => [...ps, { id: `p-${Date.now()}`, name: "شريك جديد", share: 0 }]);
  const updPartner = (id, k, v) => setPartners((ps) => ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)));
  const delPartner = (id) => setPartners((ps) => ps.filter((p) => p.id !== id));

  const exportCSV = () => {
    const head = ["الشهر", "الدخل الشهري", ...EXPENSE_FIELDS.map((f) => f.label), "صافي الربح"];
    const rows = (records || []).map((r) => [r.month, r.income, ...EXPENSE_FIELDS.map((f) => r[f.key] || 0), netProfit(r)]);
    const csv = "\uFEFF" + [head, ...rows].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "حسابات_trio_hub.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? "صباح الخير" : hour < 17 ? "نهارك سعيد" : "مساء الخير";
  let today = "";
  try { today = new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch (e) {}

  if (records === null) return (<div className="th-root th-center" dir="rtl"><style>{CSS}</style><div className="th-spinner" /></div>);

  return (
    <div className="th-root" dir="rtl">
      <style>{CSS}</style>

      <header className="th-header">
        <div className="th-greet"><p className="th-hi">{greet} 👋</p><p className="th-date">{today}</p></div>
        <div className="th-brand">
          <span className="th-status"><span className={`th-dot ${saved ? "ok" : "wait"}`} />{saved ? "محفوظ" : "جاري الحفظ…"}</span>
          <div className="th-logo">TH</div>
        </div>
      </header>

      <div className="th-hero">
        <div className="th-hero-top"><span>{periodLabel === "كل المدة" ? "صافي الربح — كل المدة" : `صافي ربح ${periodLabel}`}</span><span className="th-hero-tag">Trio Hub</span></div>
        <div className={`th-hero-val ${totals.net >= 0 ? "" : "neg"}`}>{fmt(totals.net)}</div>
        <div className="th-hero-stats">
          <div><b>{fmt(totals.income)}</b><span>الدخل</span></div>
          <div><b>{fmt(totals.expenses)}</b><span>المصاريف</span></div>
          <div>
            {comparison ? (
              <b className={`cmp ${comparison.diff >= 0 ? "up" : "down"}`}>
                {comparison.diff >= 0 ? <TrendingUp size={15} strokeWidth={2.6} /> : <TrendingDown size={15} strokeWidth={2.6} />}
                {comparison.pct !== null ? `${comparison.diff >= 0 ? "+" : ""}${comparison.pct}%` : `${comparison.diff >= 0 ? "+" : ""}${fmt(comparison.diff)}`}
              </b>
            ) : <b className="cmp flat">—</b>}
            <span>{comparison ? `مقارنة بـ ${comparison.prevMonth}` : "أول شهر"}</span>
          </div>
        </div>
      </div>

      <div className="th-period">
        <label>المدة المعروضة</label>
        <MonthPicker records={records || []} period={period} onChange={setPeriod} />
      </div>

      <section className="th-cards">
        <Card label="الدخل" value={totals.income} tone="blue" />
        <Card label="المصاريف" value={totals.expenses} tone="amber" />
        <Card label="قسط القرض" value={totals.byField.loan} tone="purple" />
        <Card label="دفعة الأكواد" value={totals.byField.codes} tone="rose" />
        {period === "all" && <Card label="متوسط الربح الشهري" value={totals.avg} tone="teal" />}
        <Card label="عدد الأشهر" value={totals.count} tone="slate" plain />
      </section>

      <section className="th-panel partners">
        <div className="th-panel-head">
          <h2><Users size={17} strokeWidth={2.2} /> <span>أرباح الشركاء</span> <span className="muted">— {periodLabel}</span></h2>
          <button className="btn ghost sm" onClick={() => setEditingPartners((v) => !v)}>{editingPartners ? "تم" : "⚙ تعديل"}</button>
        </div>
        <div className="th-partner-cards">
          {partners.map((p) => {
            const profit = Math.round(totals.net * ((Number(p.share) || 0) / shareSum));
            return (
              <div className="th-partner" key={p.id}>
                <div className="th-partner-top"><span className="th-avatar">{(p.name || "؟").trim().charAt(0)}</span><span className="th-partner-share">{Number(p.share) || 0}%</span></div>
                <span className="th-partner-name">{p.name}</span>
                <div className={`th-partner-val ${profit >= 0 ? "pos" : "neg"}`}>{fmt(profit)}</div>
              </div>
            );
          })}
        </div>
        {editingPartners && (
          <div className="th-partner-editor">
            {partners.map((p) => (
              <div className="th-partner-row" key={p.id}>
                <input className="pn" type="text" value={p.name} onChange={(e) => updPartner(p.id, "name", e.target.value)} placeholder="اسم الشريك" />
                <div className="ps"><input type="number" inputMode="numeric" value={p.share} onChange={(e) => updPartner(p.id, "share", e.target.value === "" ? "" : Number(e.target.value))} /><span>%</span></div>
                <button className="del" onClick={() => delPartner(p.id)} title="حذف">🗑</button>
              </div>
            ))}
            <div className="th-partner-foot">
              <button className="btn outline sm" onClick={addPartner}>+ إضافة شريك</button>
              <span className={`sumtag ${shareSum === 100 ? "ok" : "warn"}`}>المجموع: {shareSum}%{shareSum === 100 ? " ✓" : " (المفروض 100%)"}</span>
            </div>
          </div>
        )}
      </section>

      <section className="th-panel">
        <div className="th-panel-head"><h2><Activity size={17} strokeWidth={2.2} /> الرسم البياني</h2></div>
        <div className="th-pills">
          {METRICS.map((m) => (
            <button key={m.key} className={`pill ${metric === m.key ? "on" : ""}`} style={metric === m.key ? { background: m.color, boxShadow: `0 6px 16px ${m.color}55` } : {}} onClick={() => setMetric(m.key)}>{m.label}</button>
          ))}
        </div>
        <div className="th-pills years">
          <button className={`pill ghost ${chartRange === "recent" ? "on" : ""}`} onClick={() => setChartRange("recent")}>آخر 6 شهور</button>
          {chartYears.map((y) => (
            <button key={y} className={`pill ghost ${chartRange === y ? "on" : ""}`} onClick={() => setChartRange(y)}>{y}</button>
          ))}
        </div>
        <div className="th-chart-scroll">
          <div style={{ width: "100%", minWidth: Math.max(300, chartData.length * 58), height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 30, right: 20, left: 12, bottom: 4 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeMetric.color} stopOpacity={0.34} />
                    <stop offset="100%" stopColor={activeMetric.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1edfc" />
                <XAxis dataKey="name" tick={{ fill: "#9a93b8", fontSize: 12, fontWeight: 600 }} interval={0} height={28} axisLine={false} tickLine={false} />
                <YAxis hide domain={[(min) => (min < 0 ? Math.floor(min * 1.12) : 0), (max) => Math.ceil(max * 1.2)]} />
                <Tooltip contentStyle={{ background: "#1e1e2e", border: "none", borderRadius: 14, direction: "rtl", boxShadow: "0 12px 30px rgba(30,30,46,.3)", fontWeight: 600 }} itemStyle={{ color: "#fff" }} formatter={(v) => [fmt(v), activeMetric.label]} labelStyle={{ color: "#c9c4e0", fontWeight: 700 }} />
                <Area type="monotone" dataKey="value" name={activeMetric.label} stroke={activeMetric.color} strokeWidth={3} fill="url(#grad)" dot={{ r: 4, fill: "#fff", stroke: activeMetric.color, strokeWidth: 2.5 }} activeDot={{ r: 6 }}>
                  <LabelList dataKey="value" position="top" offset={14} formatter={(v) => (Math.abs(v) >= 1000 ? Math.round(v / 1000) + "k" : v)} style={{ fontSize: 11, fontWeight: 800, fill: "#3f3760" }} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="th-panel">
        <h2><PlusCircle size={17} strokeWidth={2.2} /> إضافة شهر جديد</h2>
        <div className="th-form">
          <Field label="اسم الشهر" hint="مثال: شهر 6 - 2026"><input type="text" value={form.month} onChange={(e) => setField("month", e.target.value)} placeholder="اكتب اسم الشهر" /></Field>
          <Field label="الدخل الشهري" tone="blue"><input type="number" inputMode="numeric" value={form.income} onChange={(e) => setField("income", e.target.value)} placeholder="0" /></Field>
          {EXPENSE_FIELDS.map((f) => (
            <Field key={f.key} label={f.label} tone="amber"><input type="number" inputMode="numeric" value={form[f.key]} onChange={(e) => setField(f.key, e.target.value)} placeholder="0" /></Field>
          ))}
          <Field label="صافي الربح (تلقائي)" tone="green"><div className={`th-net ${liveNet >= 0 ? "pos" : "neg"}`}>{fmt(liveNet)}</div></Field>
        </div>
        <div className="th-actions">
          <button className="btn primary" onClick={submit}>إضافة الشهر</button>
        </div>
      </section>

      <section className="th-panel">
        <div className="th-panel-head">
          <h2><ListChecks size={17} strokeWidth={2.2} /> سجل الأشهر</h2>
          <div className="th-actions inline"><button className="btn outline sm" onClick={exportCSV}>⬇ تصدير</button><button className="btn outline sm danger" onClick={resetAll}>↺ استرجاع</button></div>
        </div>
        <div className="th-table-wrap">
          <table className="th-table">
            <thead><tr><th>الشهر</th><th className="num">الدخل</th>{EXPENSE_FIELDS.map((f) => <th key={f.key} className="num">{f.label}</th>)}<th className="num">صافي الربح</th><th></th></tr></thead>
            <tbody>
              {(records || []).length === 0 && <tr><td colSpan={10} className="th-empty">مفيش بيانات لسه — ضيف أول شهر من فوق.</td></tr>}
              {(records || []).map((r) => {
                const net = netProfit(r);
                return (
                  <tr key={r.id} className={editingId === r.id ? "editing" : ""}>
                    <td className="mn">{r.month.trim()}</td>
                    <td className="num">{fmt(r.income)}</td>
                    {EXPENSE_FIELDS.map((f) => <td key={f.key} className="num dim">{fmt(r[f.key])}</td>)}
                    <td className={`num bold ${net >= 0 ? "pos" : "neg"}`}>{fmt(net)}</td>
                    <td className="ops"><button onClick={() => edit(r)} title="تعديل">✎</button><button onClick={() => remove(r.id)} title="حذف" className="del">🗑</button></td>
                  </tr>
                );
              })}
            </tbody>
            {(records || []).length > 0 && (
              <tfoot><tr>
                <td className="mn">الإجمالي (الكل)</td>
                <td className="num">{fmt((records || []).reduce((a, r) => a + (Number(r.income) || 0), 0))}</td>
                {EXPENSE_FIELDS.map((f) => <td key={f.key} className="num dim">{fmt((records || []).reduce((a, r) => a + (Number(r[f.key]) || 0), 0))}</td>)}
                <td className="num bold pos">{fmt((records || []).reduce((a, r) => a + netProfit(r), 0))}</td><td></td>
              </tr></tfoot>
            )}
          </table>
        </div>
      </section>

      {editingId && editForm && (
        <div className="th-modal-overlay" onClick={cancelEdit}>
          <div className="th-modal" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="th-modal-head">
              <h2><Pencil size={16} strokeWidth={2.2} /> تعديل {editForm.month?.trim()}</h2>
              <button className="th-modal-x" onClick={cancelEdit} title="إغلاق">✕</button>
            </div>
            <div className="th-form">
              <Field label="اسم الشهر" hint="مثال: شهر 6 - 2026"><input type="text" value={editForm.month} onChange={(e) => setEField("month", e.target.value)} placeholder="اكتب اسم الشهر" /></Field>
              <Field label="الدخل الشهري" tone="blue"><input type="number" inputMode="numeric" value={editForm.income} onChange={(e) => setEField("income", e.target.value)} placeholder="0" /></Field>
              {EXPENSE_FIELDS.map((f) => (
                <Field key={f.key} label={f.label} tone="amber"><input type="number" inputMode="numeric" value={editForm[f.key]} onChange={(e) => setEField(f.key, e.target.value)} placeholder="0" /></Field>
              ))}
              {(() => {
                const en = netProfit({ income: editForm.income, ...EXPENSE_FIELDS.reduce((a, f) => ({ ...a, [f.key]: editForm[f.key] }), {}) });
                return <Field label="صافي الربح (تلقائي)" tone="green"><div className={`th-net ${en >= 0 ? "pos" : "neg"}`}>{fmt(en)}</div></Field>;
              })()}
            </div>
            <div className="th-actions">
              <button className="btn primary" onClick={saveEdit}>💾 حفظ التعديل</button>
              <button className="btn ghost" onClick={cancelEdit}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <footer className="th-foot">بياناتك بتتحفظ تلقائيًا على جهازك في نفس المتصفح • Trio Hub</footer>
    </div>
  );
}

function Card({ label, value, tone, plain }) {
  const Ico = CARD_ICONS[tone];
  return (
    <div className={`th-card ${tone}`}>
      <span className="th-card-ico">{Ico && <Ico size={19} strokeWidth={2.2} />}</span>
      <span className="th-card-label">{label}</span>
      <span className="th-card-value">{plain ? value : fmt(value)}</span>
    </div>
  );
}
function Field({ label, hint, tone, children }) {
  return (<label className={`th-field ${tone || ""}`}><span className="th-field-label">{label}</span>{children}{hint && <span className="th-field-hint">{hint}</span>}</label>);
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; }
.th-root {
  font-family: 'Rubik', system-ui, sans-serif;
  background: linear-gradient(180deg, #ede7ff 0%, #f3eeff 25%, #f7f4ff 55%, #faf8ff 100%);
  background-attachment: fixed; color: #1e1e2e; min-height: 100vh;
  padding: 20px clamp(12px, 4vw, 34px) 36px; max-width: 1140px; margin: 0 auto;
}
.th-center { display:flex; align-items:center; justify-content:center; min-height:60vh; }
.th-spinner { width:34px; height:34px; border:3px solid #ddd4fb; border-top-color:#7c5cfc; border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.th-header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:18px; }
.th-hi { margin:0; font-size:22px; font-weight:800; color:#1e1e2e; }
.th-date { margin:2px 0 0; font-size:12.5px; color:#8b86a8; font-weight:500; }
.th-brand { display:flex; align-items:center; gap:10px; }
.th-logo { width:46px; height:46px; border-radius:15px; background:linear-gradient(140deg,#8b6bff,#5e3df5); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; color:#fff; box-shadow:0 10px 22px rgba(124,92,252,.4); }
.th-status { font-size:11.5px; color:#8b86a8; display:flex; align-items:center; gap:6px; background:#fff; padding:7px 12px; border-radius:999px; box-shadow:0 4px 14px rgba(94,61,245,.08); }
.th-dot { width:8px; height:8px; border-radius:50%; }
.th-dot.ok { background:#22c55e; } .th-dot.wait { background:#f59e0b; animation:pulse 1s infinite; }
@keyframes pulse { 50% { opacity:.4; } }

.th-hero { background:linear-gradient(150deg,#2c2742,#1e1e2e); color:#fff; border-radius:26px; padding:22px 24px; margin-bottom:16px; box-shadow:0 18px 44px rgba(30,30,46,.34); position:relative; overflow:hidden; }
.th-hero::after { content:''; position:absolute; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(124,92,252,.45),transparent 70%); top:-70px; left:-30px; }
.th-hero-top { display:flex; justify-content:space-between; align-items:center; font-size:13.5px; font-weight:600; color:#c9c4e0; position:relative; }
.th-hero-tag { background:rgba(124,92,252,.25); color:#d9d0ff; padding:4px 11px; border-radius:999px; font-size:11.5px; font-weight:700; }
.th-hero-val { font-size:40px; font-weight:800; letter-spacing:-1px; margin:8px 0 14px; font-variant-numeric:tabular-nums; position:relative; }
.th-hero-val.neg { color:#fca5a5; }
.th-hero-stats { display:flex; gap:14px; position:relative; }
.th-hero-stats > div { flex:1; display:flex; flex-direction:column; gap:2px; padding-right:14px; border-right:1px solid rgba(255,255,255,.12); }
.th-hero-stats > div:last-child { border-right:none; }
.th-hero-stats b { font-size:16px; font-weight:800; font-variant-numeric:tabular-nums; }
.th-hero-stats b.cmp { display:flex; align-items:center; gap:4px; }
.th-hero-stats b.up { color:#4ade80; } .th-hero-stats b.down { color:#fca5a5; } .th-hero-stats b.flat { color:#a59fc4; }
.th-hero-stats span { font-size:11.5px; color:#a59fc4; font-weight:500; }

.th-period { display:flex; align-items:center; gap:12px; background:#fff; border-radius:18px; padding:13px 15px; margin-bottom:16px; box-shadow:0 6px 18px rgba(94,61,245,.07); flex-wrap:wrap; }
.th-period > label { font-size:13.5px; font-weight:700; color:#5b5476; white-space:nowrap; }
.th-picker { position:relative; flex:1; min-width:180px; }
.th-picker-btn { width:100%; display:flex; justify-content:space-between; align-items:center; font-family:inherit; font-size:14.5px; font-weight:700; color:#1e1e2e; background:#f3eeff; border:1.5px solid #e4dbff; border-radius:13px; padding:11px 14px; cursor:pointer; }
.th-picker-btn:hover { border-color:#a78bff; } .th-picker-btn .caret { color:#7c5cfc; }
.th-pick-backdrop { position:fixed; inset:0; z-index:40; }
.th-pick-pop { position:absolute; top:calc(100% + 8px); right:0; left:0; z-index:50; background:#fff; border-radius:18px; box-shadow:0 18px 44px rgba(30,30,46,.2); padding:14px; border:1px solid #efeafd; }
.th-pick-all { width:100%; font-family:inherit; font-weight:700; font-size:13.5px; padding:10px; border-radius:12px; border:none; cursor:pointer; background:#f3eeff; color:#5b5476; margin-bottom:12px; }
.th-pick-all.on { background:#7c5cfc; color:#fff; }
.th-pick-ynav { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.th-pick-ynav span { font-size:17px; font-weight:800; color:#1e1e2e; }
.th-pick-ynav button { width:36px; height:36px; border-radius:11px; border:none; background:#f3eeff; color:#7c5cfc; font-size:18px; font-weight:800; cursor:pointer; }
.th-pick-ynav button:hover { background:#e9e0ff; }
.th-pick-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.th-pick-m { position:relative; aspect-ratio:1.4; border:none; border-radius:12px; background:#f6f3ff; color:#5b5476; font-family:inherit; font-size:15px; font-weight:700; cursor:pointer; transition:.12s; }
.th-pick-m:hover:not(.off) { background:#e9e0ff; }
.th-pick-m.on { background:#7c5cfc; color:#fff; box-shadow:0 6px 16px rgba(124,92,252,.4); }
.th-pick-m.off { color:#cfc9e4; cursor:not-allowed; background:#faf8ff; }
.th-pick-m i { position:absolute; bottom:6px; left:50%; transform:translateX(-50%); width:5px; height:5px; border-radius:50%; background:#7c5cfc; }
.th-pick-m.on i { background:#fff; }
.th-pick-hint { font-size:11px; color:#a59fc4; text-align:center; margin:11px 0 2px; }

.th-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:16px; }
.th-card { background:#fff; border-radius:20px; padding:16px; display:flex; flex-direction:column; gap:5px; box-shadow:0 6px 18px rgba(94,61,245,.06); }
.th-card-ico { width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; margin-bottom:5px; background:#f3eeff; color:#7c5cfc; }
.th-card.amber .th-card-ico { background:#fff3e0; color:#f59e0b; } .th-card.rose .th-card-ico { background:#fdecf3; color:#e84d8a; } .th-card.teal .th-card-ico { background:#e3f8f4; color:#0d9488; }
.th-card-label { font-size:12.5px; color:#8b86a8; font-weight:600; }
.th-card-value { font-size:22px; font-weight:800; letter-spacing:-.5px; font-variant-numeric:tabular-nums; color:#1e1e2e; }

.th-panel { background:#fff; border-radius:22px; padding:20px clamp(14px,2.4vw,24px); margin-bottom:16px; box-shadow:0 6px 18px rgba(94,61,245,.06); }
.th-panel h2 { margin:0 0 16px; font-size:16px; font-weight:800; color:#1e1e2e; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.th-panel h2 svg { color:#7c5cfc; flex-shrink:0; }
.th-modal-head h2 svg { color:#7c5cfc; }
.th-picker-label { display:flex; align-items:center; gap:8px; }
.th-picker-label svg { color:#7c5cfc; }
.th-panel h2 .muted { color:#8b86a8; font-weight:600; font-size:14px; }
.th-panel-head { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
.th-panel-head h2 { margin:0; }

.partners { background:linear-gradient(160deg,#faf8ff,#fff); }
.th-partner-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
.th-partner { border-radius:18px; padding:15px; background:#f6f3ff; }
.th-partner-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:9px; }
.th-avatar { width:38px; height:38px; border-radius:50%; background:linear-gradient(140deg,#8b6bff,#5e3df5); color:#fff; font-weight:800; font-size:17px; display:flex; align-items:center; justify-content:center; }
.th-partner-share { font-size:11.5px; font-weight:700; color:#7c5cfc; background:#ede7ff; padding:3px 9px; border-radius:999px; }
.th-partner-name { font-weight:700; font-size:14px; color:#5b5476; }
.th-partner-val { font-size:22px; font-weight:800; font-variant-numeric:tabular-nums; margin-top:3px; }
.th-partner-val.pos { color:#16a34a; } .th-partner-val.neg { color:#dc2626; }

.th-partner-editor { margin-top:15px; border-top:1px solid #efeafd; padding-top:13px; display:flex; flex-direction:column; gap:9px; }
.th-partner-row { display:flex; gap:8px; align-items:center; }
.th-partner-row .pn { flex:1; font-family:inherit; font-size:14px; font-weight:600; padding:10px 12px; border:1.5px solid #e4dbff; border-radius:12px; outline:none; background:#faf8ff; }
.th-partner-row .pn:focus { border-color:#7c5cfc; }
.th-partner-row .ps { display:flex; align-items:center; gap:3px; background:#faf8ff; border:1.5px solid #e4dbff; border-radius:12px; padding-left:9px; }
.th-partner-row .ps input { width:58px; border:none; background:transparent; font-family:inherit; font-size:14px; font-weight:700; padding:10px; outline:none; text-align:center; }
.th-partner-row .ps span { color:#8b86a8; font-weight:700; font-size:13px; }
.th-partner-row .del { width:38px; height:38px; border:none; border-radius:12px; background:#fdeef0; color:#dc2626; cursor:pointer; font-size:14px; flex-shrink:0; }
.th-partner-foot { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
.sumtag { font-size:12px; font-weight:700; padding:5px 11px; border-radius:999px; }
.sumtag.ok { color:#16a34a; background:#e7f9ee; } .sumtag.warn { color:#b45309; background:#fff6e5; }

.th-pills { display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap; }
.th-pills.years { margin-bottom:16px; }
.pill { font-family:inherit; font-size:13.5px; font-weight:700; padding:9px 18px; border-radius:999px; border:none; cursor:pointer; background:#f3eeff; color:#7a72a0; transition:.15s; }
.pill:hover { background:#e9e0ff; }
.pill.on { color:#fff; }
.pill.ghost { font-size:13px; padding:8px 15px; background:#f6f3ff; }
.pill.ghost.on { background:#1e1e2e; color:#fff; }

.th-form { display:grid; grid-template-columns:repeat(auto-fit,minmax(145px,1fr)); gap:13px; }
.th-field { display:flex; flex-direction:column; gap:6px; }
.th-field-label { font-size:12.5px; color:#5b5476; font-weight:600; }
.th-field-hint { font-size:11px; color:#a59fc4; }
.th-field input { background:#faf8ff; border:1.5px solid #e4dbff; border-radius:13px; padding:12px 13px; color:#1e1e2e; font-family:inherit; font-size:15px; font-weight:700; outline:none; transition:.15s; width:100%; }
.th-field input:focus { border-color:#7c5cfc; background:#fff; box-shadow:0 0 0 4px rgba(124,92,252,.12); }
.th-net { background:#e7f9ee; border:1.5px solid #bbecca; border-radius:13px; padding:12px 13px; font-size:17px; font-weight:800; font-variant-numeric:tabular-nums; color:#16a34a; }
.th-net.neg { background:#fdeef0; border-color:#f8c9cf; color:#dc2626; }

.th-actions { display:flex; gap:10px; margin-top:16px; flex-wrap:wrap; }
.th-actions.inline { margin-top:0; }
.btn { font-family:inherit; font-weight:700; font-size:14px; border-radius:14px; padding:12px 22px; cursor:pointer; border:none; transition:.15s; }
.btn.sm { font-size:13px; padding:9px 15px; border-radius:12px; }
.btn.primary { background:linear-gradient(135deg,#8b6bff,#5e3df5); color:#fff; box-shadow:0 8px 20px rgba(124,92,252,.35); }
.btn.primary:hover { filter:brightness(1.05); transform:translateY(-1px); }
.btn.ghost { background:#f3eeff; color:#5b5476; }
.btn.ghost:hover { background:#e9e0ff; }
.btn.outline { background:#f6f3ff; color:#5b5476; }
.btn.outline:hover { background:#ede7ff; }
.btn.outline.danger { color:#dc2626; background:#fdeef0; }
.btn.outline.danger:hover { background:#fbdde1; }

.th-table-wrap { overflow-x:auto; border-radius:16px; border:1px solid #efeafd; -webkit-overflow-scrolling:touch; }
.th-table { width:100%; border-collapse:collapse; font-size:13.5px; min-width:820px; }
.th-table th { background:#f6f3ff; padding:12px 13px; text-align:right; font-weight:700; color:#8b86a8; font-size:12px; white-space:nowrap; }
.th-table th.num { text-align:left; }
.th-table td { padding:11px 13px; border-top:1px solid #f3f0fc; white-space:nowrap; }
.th-table tbody tr:hover { background:#faf8ff; }
.th-table tr.editing { background:#f3eeff; }
.th-table .num { text-align:left; font-variant-numeric:tabular-nums; }
.th-table .mn { font-weight:700; color:#1e1e2e; }
.th-table .dim { color:#8b86a8; }
.th-table .bold { font-weight:800; }
.th-table .pos { color:#16a34a; } .th-table .neg { color:#dc2626; }
.th-table tfoot td { background:#f6f3ff; font-weight:800; border-top:2px solid #e4dbff; }
.th-empty { text-align:center; color:#a59fc4; padding:28px; }
.ops { display:flex; gap:6px; }
.ops button { background:#f3eeff; border:none; width:32px; height:32px; border-radius:10px; cursor:pointer; font-size:13px; color:#5b5476; transition:.15s; }
.ops button:hover { background:#e9e0ff; }
.ops button.del:hover { background:#fdeef0; color:#dc2626; }

.th-chart-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
.th-foot { text-align:center; font-size:11.5px; color:#a59fc4; margin-top:6px; }

.th-modal-overlay { position:fixed; inset:0; z-index:100; background:rgba(30,30,46,.5); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:16px; animation:fade .15s ease; }
@keyframes fade { from { opacity:0; } }
.th-modal { background:#fff; border-radius:24px; padding:22px clamp(16px,3vw,26px); width:100%; max-width:560px; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(30,30,46,.4); animation:pop .18s cubic-bezier(.2,.8,.3,1.2); }
@keyframes pop { from { transform:scale(.94); opacity:0; } }
.th-modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.th-modal-head h2 { margin:0; font-size:17px; font-weight:800; color:#1e1e2e; }
.th-modal-x { width:34px; height:34px; border:none; border-radius:11px; background:#f3eeff; color:#5b5476; font-size:15px; cursor:pointer; flex-shrink:0; }
.th-modal-x:hover { background:#e9e0ff; }

@media (max-width:600px) {
  .th-root { padding:16px 12px 28px; }
  .th-hi { font-size:19px; } .th-hero-val { font-size:32px; }
  .th-cards { grid-template-columns:repeat(2,1fr); gap:10px; }
  .th-card-value { font-size:19px; }
  .th-partner-cards { grid-template-columns:repeat(2,1fr); }
  .th-form { grid-template-columns:repeat(2,1fr); }
  .th-panel { padding:16px 14px; }
}
`;
