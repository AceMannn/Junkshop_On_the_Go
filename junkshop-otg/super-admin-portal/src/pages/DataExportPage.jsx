import { useEffect, useMemo, useState } from 'react';
import { Download, FileDown, Loader2 } from 'lucide-react';
import { superAdminApi } from '../services/api';
import { downloadSheet } from '../utils/exportSheet';
import { actorRoleLabel, formatDate } from '../utils/format';
import {
  superCardClass,
  superFilterPillClass,
  superPageTitleClass,
  superPrimaryButtonClass,
  superSecondaryButtonClass,
} from '../utils/superAdminUi';

function datasetLabel(catalog, id) {
  return catalog.find((item) => item.id === id)?.label || id;
}

export default function DataExportPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]);

  const loadPage = () => {
    setLoading(true);
    setError('');
    return Promise.all([superAdminApi.listExportCatalog(), superAdminApi.listExportHistory()])
      .then(([catalogData, historyData]) => {
        setCatalog(catalogData.datasets || []);
        setHistory(historyData.history || []);
      })
      .catch((err) => setError(err.message || 'Could not load export tools.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([superAdminApi.listExportCatalog(), superAdminApi.listExportHistory()])
      .then(([catalogData, historyData]) => {
        if (cancelled) return;
        setCatalog(catalogData.datasets || []);
        setHistory(historyData.history || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load export tools.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSummary = useMemo(() => {
    if (selected.length === 0) return 'No datasets selected';
    if (selected.length === 1) return datasetLabel(catalog, selected[0]);
    return `${selected.length} datasets selected`;
  }, [catalog, selected]);

  const toggleDataset = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    setSuccess('');
  };

  const selectAll = () => {
    setSelected(catalog.map((item) => item.id));
    setSuccess('');
  };

  const clearSelection = () => {
    setSelected([]);
    setSuccess('');
  };

  const runExport = async (datasets) => {
    if (datasets.length === 0) {
      setError('Select at least one dataset to export.');
      return;
    }

    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const data = await superAdminApi.runDataExports(datasets);
      (data.exports || []).forEach((item) => {
        downloadSheet(item.filename, item.headers, item.rows);
      });
      if (data.history) {
        setHistory((prev) => [data.history, ...prev.filter((row) => row.id !== data.history.id)]);
      } else {
        await loadPage();
      }
      setSuccess(
        `Downloaded ${data.exports?.length || 0} CSV file(s) with ${data.history?.recordCount || 0} total rows.`
      );
    } catch (err) {
      setError(err.message || 'Could not generate export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={superPageTitleClass}>Data Export</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Bulk export platform datasets as CSV files. Exports are logged for audit review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={loading || catalog.length === 0}
            className={superSecondaryButtonClass}
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => runExport(catalog.map((item) => item.id))}
            disabled={loading || exporting || catalog.length === 0}
            className={`${superPrimaryButtonClass} gap-2`}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown size={16} />}
            Export all
          </button>
          <button
            type="button"
            onClick={() => runExport(selected)}
            disabled={loading || exporting || selected.length === 0}
            className={`${superPrimaryButtonClass} gap-2`}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} />}
            Export selected
          </button>
        </div>
      </div>

      <div className={`${superCardClass} px-4 py-3 text-sm text-zinc-600`}>
        <span className="font-semibold text-[#191c1c]">{selectedSummary}</span>
        <span className="mx-2 text-zinc-300">|</span>
        CSV format for now (Excel-compatible). Up to 500 rows per operational table.
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading export datasets...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalog.map((item) => {
              const active = selected.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`${superCardClass} p-5 transition-colors ${
                    active ? 'border-[#006c49] bg-emerald-50/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDataset(item.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="font-semibold text-[#191c1c]">{item.label}</p>
                      <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDataset(item.id)}
                      className={superFilterPillClass(active)}
                    >
                      {active ? 'Selected' : 'Select'}
                    </button>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => runExport([item.id])}
                      disabled={exporting}
                      className="text-sm font-semibold text-[#006c49] hover:underline disabled:opacity-60"
                    >
                      Export now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <section className={`${superCardClass} overflow-hidden`}>
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-lg font-bold text-[#191c1c]">Export history</h2>
              <p className="mt-1 text-sm text-zinc-500">Recent bulk exports from this portal.</p>
            </div>

            {history.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-zinc-500">No exports yet.</div>
            ) : (
              <div className="scroll-x-clean">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Exported by</th>
                      <th className="px-6 py-4">Datasets</th>
                      <th className="px-6 py-4">Rows</th>
                      <th className="px-6 py-4">Format</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {history.map((row) => (
                      <tr key={row.id} className="transition-colors hover:bg-zinc-50/80">
                        <td className="px-6 py-3 text-zinc-600">{formatDate(row.createdAt)}</td>
                        <td className="px-6 py-3">
                          <span className="font-medium text-[#191c1c]">{row.actor?.name || 'Unknown'}</span>
                          {row.actor?.role ? (
                            <span className="mt-0.5 block text-xs text-zinc-500">
                              {actorRoleLabel(row.actor.role)}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {(row.datasets || []).map((datasetId) => (
                              <span
                                key={`${row.id}-${datasetId}`}
                                className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-700"
                              >
                                {datasetLabel(catalog, datasetId)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3 font-semibold text-[#191c1c]">{row.recordCount}</td>
                        <td className="px-6 py-3 uppercase text-zinc-600">{row.format}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {selected.length > 0 ? (
        <div className="flex justify-end">
          <button type="button" onClick={clearSelection} className={superSecondaryButtonClass}>
            Clear selection
          </button>
        </div>
      ) : null}
    </div>
  );
}
