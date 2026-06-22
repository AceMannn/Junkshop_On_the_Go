import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Download, Plus } from "lucide-react";
import { domainApi } from "../../services/api";
import LoadErrorBanner from "../ui/LoadErrorBanner";
import { normalizeTransaction } from "../../utils/catalogMappers";
import { REFRESH_INTERVAL_MS, useAutoRefresh } from "../../hooks/useAutoRefresh";
import NumberInput from "../ui/NumberInput";

export default function ProviderTransactionsTab({ onNotify }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        customerEmail: "",
        material: "",
        weight: "",
        pricePerUnit: "",
    });

    const load = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const { transactions } = await domainApi.getTransactions();
            setRows((transactions || []).map(normalizeTransaction));
            setLoadError("");
        } catch (err) {
            if (!silent) {
                setRows([]);
                if (!err?.sessionExpired && !err?.accountSuspended) {
                    setLoadError(err.message || "Could not load transactions.");
                }
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(false);
    }, [load]);

    useAutoRefresh(() => load(true), { intervalMs: REFRESH_INTERVAL_MS });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) =>
            [row.date, row.material, row.shop, row.amount, row.status]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [rows, search]);

    const totalEarnings = useMemo(() => {
        return filtered.reduce((sum, row) => {
            const num = Number(String(row.amount).replace(/[₱,]/g, ""));
            return sum + (Number.isFinite(num) ? num : 0);
        }, 0);
    }, [filtered]);

    const handleExport = () => {
        const header = ["Date", "Material", "Weight", "Amount", "Customer", "Status"];
        const lines = filtered.map((row) =>
            [row.date, row.material, row.weight, row.amount, row.shop, row.status]
                .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                .join(",")
        );
        const csv = [header.join(","), ...lines].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "provider-transactions.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleRecordSale = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await domainApi.createTransaction({
                customerEmail: form.customerEmail.trim(),
                material: form.material.trim(),
                weight: Number(form.weight),
                pricePerUnit: Number(form.pricePerUnit),
            });
            setForm({ customerEmail: "", material: "", weight: "", pricePerUnit: "" });
            setShowForm(false);
            load();
            onNotify?.("Sale recorded.");
        } catch (err) {
            onNotify?.(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191c1c]">
                        Transactions
                    </h1>
                    <p className="text-[#72796e] mt-2 text-sm">
                        Customer log trips, completed pickups, and walk-in sales.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setShowForm((v) => !v)}
                        className="inline-flex items-center gap-2 border border-[#154212] text-[#154212] px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                        <Plus size={16} />
                        Record sale
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={filtered.length === 0}
                        className="inline-flex items-center gap-2 bg-[#154212] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {loadError && (
                <LoadErrorBanner message={loadError} onRetry={() => load(false)} />
            )}

            {showForm && (
                <form
                    onSubmit={handleRecordSale}
                    className="bg-white border border-zinc-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    <input
                        type="email"
                        required
                        placeholder="Customer email (registered)"
                        value={form.customerEmail}
                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                        className="border border-zinc-200 rounded-xl px-4 py-2.5 text-sm sm:col-span-2"
                    />
                    <input
                        required
                        placeholder="Material"
                        value={form.material}
                        onChange={(e) => setForm({ ...form, material: e.target.value })}
                        className="border border-zinc-200 rounded-xl px-4 py-2.5 text-sm"
                    />
                    <NumberInput
                        min={0.1}
                        step={0.1}
                        required
                        placeholder="Weight (kg)"
                        value={form.weight}
                        onChange={(v) => setForm({ ...form, weight: v })}
                        inputClassName="w-full border border-zinc-200 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#154212]/20"
                    />
                    <NumberInput
                        min={0}
                        step={0.01}
                        required
                        placeholder="Price per kg (₱)"
                        value={form.pricePerUnit}
                        onChange={(v) => setForm({ ...form, pricePerUnit: v })}
                        inputClassName="w-full border border-zinc-200 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#154212]/20"
                    />
                    <button
                        type="submit"
                        disabled={saving}
                        className="sm:col-span-2 bg-[#154212] text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save transaction"}
                    </button>
                </form>
            )}

            <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 py-2.5 max-w-md">
                <Search size={18} className="text-[#72796e] mr-2 shrink-0" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full bg-transparent text-sm outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-xs text-[#72796e]">Showing</p>
                    <h3 className="text-xl font-bold text-emerald-700">
                        {filtered.length} / {rows.length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-xs text-[#72796e]">Filtered total</p>
                    <h3 className="text-xl font-bold text-emerald-700">
                        ₱{totalEarnings.toFixed(2)}
                    </h3>
                </div>
            </div>

            {loading ? (
                <p className="text-sm text-[#72796e]">Loading transactions...</p>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-zinc-200 text-[#72796e]">
                    No transactions yet.
                </div>
            ) : (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="md:hidden divide-y divide-zinc-100">
                        {filtered.map((row) => (
                            <div key={row.id} className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-[#191c1c]">{row.material}</p>
                                        <p className="text-xs text-[#72796e]">{row.date}</p>
                                    </div>
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 shrink-0">
                                        {row.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Weight</p>
                                        <p>{row.weight}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Amount</p>
                                        <p className="text-emerald-700 font-semibold">{row.amount}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-[#72796e]">Customer: {row.shop}</p>
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:block scroll-x-clean">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f3f4f3] text-[#42493e]">
                                <tr>
                                    <th className="text-left p-3 sm:p-4">Date</th>
                                    <th className="text-left p-3 sm:p-4">Material</th>
                                    <th className="text-left p-3 sm:p-4">Weight</th>
                                    <th className="text-left p-3 sm:p-4">Amount</th>
                                    <th className="text-left p-3 sm:p-4">Customer</th>
                                    <th className="text-left p-3 sm:p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.map((row) => (
                                    <tr key={row.id} className="hover:bg-zinc-50">
                                        <td className="p-3 sm:p-4">{row.date}</td>
                                        <td className="p-3 sm:p-4 font-medium">{row.material}</td>
                                        <td className="p-3 sm:p-4">{row.weight}</td>
                                        <td className="p-3 sm:p-4 text-emerald-700 font-semibold">
                                            {row.amount}
                                        </td>
                                        <td className="p-3 sm:p-4">{row.shop}</td>
                                        <td className="p-3 sm:p-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
