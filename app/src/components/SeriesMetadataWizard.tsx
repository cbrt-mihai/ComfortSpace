import { useEffect, useState } from "react";
import { getSeriesMetadata, saveSeriesMetadata } from "../api";
import type { Series, SeriesMetadata } from "../types";

interface SeriesMetadataWizardProps {
  series: Series;
  onClose: () => void;
  onSaved: (series: Series) => void;
}

type Step = 1 | 2 | 3 | 4;

const EMPTY: SeriesMetadata = {};

export function SeriesMetadataWizard({ series, onClose, onSaved }: SeriesMetadataWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [metadata, setMetadata] = useState<SeriesMetadata>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSeriesMetadata(series.slug)
      .then((meta) => {
        setMetadata({
          title: meta.title ?? series.title,
          author: meta.author ?? series.author,
          description: meta.description ?? series.description,
          yearStart: meta.yearStart ?? series.yearStart,
          yearEnd: meta.yearEnd ?? series.yearEnd,
          genres: meta.genres ?? series.genres,
          tags: meta.tags ?? series.tags,
          status: meta.status ?? series.status,
          altTitles: meta.altTitles ?? series.altTitles,
          publisher: meta.publisher ?? series.publisher,
          language: meta.language ?? series.language,
          chapterOverrides: meta.chapterOverrides ?? {},
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [series]);

  const update = (partial: Partial<SeriesMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await saveSeriesMetadata(series.slug, metadata);
      if (result.series) onSaved(result.series);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setChapterTitle = (volNum: number, chNum: number, title: string) => {
    const overrides = { ...metadata.chapterOverrides };
    const volKey = String(volNum);
    const chKey = String(chNum);
    if (!overrides[volKey]) overrides[volKey] = {};
    if (title.trim()) {
      overrides[volKey][chKey] = { title: title.trim() };
    } else {
      delete overrides[volKey][chKey];
      if (Object.keys(overrides[volKey]).length === 0) delete overrides[volKey];
    }
    update({ chapterOverrides: overrides });
  };

  const getChapterTitle = (volNum: number, chNum: number, defaultTitle: string) => {
    return metadata.chapterOverrides?.[String(volNum)]?.[String(chNum)]?.title ?? defaultTitle;
  };

  if (loading) {
    return (
      <WizardShell onClose={onClose}>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </WizardShell>
    );
  }

  return (
    <WizardShell onClose={onClose}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text">Edit series info</h2>
        <p className="text-text-muted text-sm mt-1">{series.title}</p>
        <div className="flex gap-2 mt-4">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded ${s <= step ? "bg-accent" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field label="Title">
            <input
              value={metadata.title ?? ""}
              onChange={(e) => update({ title: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Author">
            <input
              value={metadata.author ?? ""}
              onChange={(e) => update({ author: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Year start">
              <input
                type="number"
                value={metadata.yearStart ?? ""}
                onChange={(e) =>
                  update({ yearStart: e.target.value ? parseInt(e.target.value, 10) : undefined })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Year end">
              <input
                type="number"
                value={metadata.yearEnd ?? ""}
                onChange={(e) =>
                  update({ yearEnd: e.target.value ? parseInt(e.target.value, 10) : undefined })
                }
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={metadata.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
              rows={4}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Field label="Status">
            <select
              value={metadata.status ?? ""}
              onChange={(e) =>
                update({
                  status: (e.target.value || undefined) as SeriesMetadata["status"],
                })
              }
              className={inputClass}
            >
              <option value="">Not set</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
            </select>
          </Field>
          <Field label="Publisher">
            <input
              value={metadata.publisher ?? ""}
              onChange={(e) => update({ publisher: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Language">
            <input
              value={metadata.language ?? ""}
              onChange={(e) => update({ language: e.target.value })}
              placeholder="en, ja, …"
              className={inputClass}
            />
          </Field>
          <Field label="Genres (comma-separated)">
            <input
              value={(metadata.genres ?? []).join(", ")}
              onChange={(e) =>
                update({
                  genres: e.target.value
                    .split(",")
                    .map((g) => g.trim())
                    .filter(Boolean),
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              value={(metadata.tags ?? []).join(", ")}
              onChange={(e) =>
                update({
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Alternate titles (comma-separated)">
            <input
              value={(metadata.altTitles ?? []).join(", ")}
              onChange={(e) =>
                update({
                  altTitles: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {series.volumes.map((vol) => (
            <div key={vol.number}>
              <h3 className="font-medium text-text mb-2">
                Volume {String(vol.number).padStart(2, "0")}
              </h3>
              <div className="space-y-2">
                {vol.chapters.map((ch) => (
                  <div key={ch.number} className="flex items-center gap-2 text-sm">
                    <span className="text-text-muted w-24 shrink-0">{ch.title}</span>
                    <input
                      value={getChapterTitle(vol.number, ch.number, ch.title)}
                      onChange={(e) =>
                        setChapterTitle(vol.number, ch.number, e.target.value)
                      }
                      placeholder={ch.title}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div>
          <p className="text-text-muted text-sm mb-3">
            Preview of <code className="text-accent">series.json</code>:
          </p>
          <pre className="bg-surface border border-border rounded-lg p-4 text-xs text-text overflow-auto max-h-80">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex justify-between mt-8 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep((s) => (s - 1) as Step) : onClose())}
          className="px-4 py-2 text-sm rounded-lg border border-border text-text-muted hover:text-text transition-colors"
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) as Step)}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>
    </WizardShell>
  );
}

function WizardShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface-raised border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent";
