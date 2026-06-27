import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { verificationApi } from "../../services/api";
import ImageDocumentUpload from "../ui/ImageDocumentUpload";

const selectClass =
    "w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#154212]";

function imageSrc(data) {
    if (!data) return "";
    if (data.startsWith("data:")) return data;
    if (/^https?:\/\//i.test(data)) return data;
    return `data:image/jpeg;base64,${data}`;
}

function buildDocumentPayload(preview, docType, fileName, mimeType) {
    if (!preview) return null;
    if (!docType) {
        return { error: "Select an ID type before uploading." };
    }

    const resolvedMime =
        mimeType ||
        (preview.startsWith("data:") ? preview.match(/^data:([^;]+);/)?.[1] : "") ||
        "image/jpeg";

    return {
        docType,
        fileName: fileName || docType,
        mimeType: resolvedMime,
        data: preview,
    };
}

function DocumentSection({ title, description, children }) {
    return (
        <section className="rounded-2xl border border-[#c2c9bb] bg-white p-5 sm:p-6 space-y-4">
            <div>
                <h3 className="text-base font-bold text-[#191c1c]">{title}</h3>
                {description && <p className="mt-1 text-sm text-[#5c6658]">{description}</p>}
            </div>
            {children}
        </section>
    );
}

export default function ProviderVerificationTab({ user, onNotify, onUserUpdate }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState("");
    const [verification, setVerification] = useState(null);

    const markDirty = () => setIsDirty(true);

    const [govType, setGovType] = useState("");
    const [govPreview, setGovPreview] = useState("");
    const [govFileName, setGovFileName] = useState("");
    const [govMime, setGovMime] = useState("");

    const [permitType, setPermitType] = useState("");
    const [permitPreview, setPermitPreview] = useState("");
    const [permitFileName, setPermitFileName] = useState("");
    const [permitMime, setPermitMime] = useState("");

    const [photoPreviews, setPhotoPreviews] = useState({ 1: "", 2: "", 3: "" });
    const [photoMeta, setPhotoMeta] = useState({
        1: { fileName: "", mimeType: "" },
        2: { fileName: "", mimeType: "" },
        3: { fileName: "", mimeType: "" },
    });

    const status = verification?.verificationStatus || user?.verificationStatus || "draft";
    const canEdit = status === "draft" || status === "rejected";
    const isApproved = status === "approved";
    const isPending = status === "pending";

    const requirements = verification?.requirements || {};
    const govTypes = requirements.governmentIdTypes || [];
    const permitTypes = requirements.businessPermitTypes || [];
    const photoSlots = requirements.shopPhotoSlots || [];

    const hydrateFromVerification = useCallback((payload) => {
        const docs = payload?.documents || {};
        const gov = docs.governmentId;
        const permit = docs.businessPermit;

        setGovType(gov?.docType || "");
        setGovPreview(gov?.data ? imageSrc(gov.data) : "");
        setGovFileName(gov?.fileName || "");
        setGovMime(gov?.mimeType || "");

        setPermitType(permit?.docType || "");
        setPermitPreview(permit?.data ? imageSrc(permit.data) : "");
        setPermitFileName(permit?.fileName || "");
        setPermitMime(permit?.mimeType || "");

        const nextPreviews = { 1: "", 2: "", 3: "" };
        const nextMeta = {
            1: { fileName: "", mimeType: "" },
            2: { fileName: "", mimeType: "" },
            3: { fileName: "", mimeType: "" },
        };

        (docs.shopPhotos || []).forEach((photo) => {
            const slot = photo.slot;
            if (!slot) return;
            nextPreviews[slot] = photo.data ? imageSrc(photo.data) : "";
            nextMeta[slot] = {
                fileName: photo.fileName || "",
                mimeType: photo.mimeType || "",
            };
        });

        setPhotoPreviews(nextPreviews);
        setPhotoMeta(nextMeta);
        setIsDirty(false);
    }, []);

    const loadVerification = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { verification: payload } = await verificationApi.getMe();
            setVerification(payload);
            hydrateFromVerification(payload);
        } catch (loadError) {
            setError(loadError.message || "Could not load verification details.");
        } finally {
            setLoading(false);
        }
    }, [hydrateFromVerification]);

    useEffect(() => {
        loadVerification();
    }, [loadVerification]);

    const shopPhotosPayload = useMemo(
        () =>
            photoSlots
                .map((slotDef) => {
                    const preview = photoPreviews[slotDef.slot];
                    if (!preview) return null;
                    const meta = photoMeta[slotDef.slot] || {};
                    return {
                        slot: slotDef.slot,
                        label: slotDef.label,
                        fileName: meta.fileName || slotDef.label,
                        mimeType:
                            meta.mimeType ||
                            (preview.startsWith("data:")
                                ? preview.match(/^data:([^;]+);/)?.[1]
                                : "image/jpeg"),
                        data: preview,
                    };
                })
                .filter(Boolean),
        [photoMeta, photoPreviews, photoSlots]
    );

    const buildDocumentsPayload = () => {
        const govPayload = buildDocumentPayload(govPreview, govType, govFileName, govMime);
        if (govPayload?.error) {
            throw new Error(govPayload.error);
        }

        const permitPayload = buildDocumentPayload(
            permitPreview,
            permitType,
            permitFileName,
            permitMime
        );
        if (permitPayload?.error) {
            throw new Error(permitPayload.error);
        }

        return {
            governmentId: govPayload,
            businessPermit: permitPayload,
            shopPhotos: shopPhotosPayload,
        };
    };

    const applyVerificationMeta = (updated) => {
        setVerification((prev) => ({
            ...prev,
            ...updated,
            requirements: updated.requirements || prev?.requirements,
        }));
        onUserUpdate?.({
            ...user,
            verificationStatus: updated.verificationStatus,
            verificationRejectNote: updated.verificationRejectNote || "",
        });
        setIsDirty(false);
    };

    const persistDocuments = async ({ notify = true } = {}) => {
        const payload = buildDocumentsPayload();

        const { verification: updated, message } = await verificationApi.saveDocuments(payload);
        applyVerificationMeta(updated);
        if (notify) {
            onNotify?.(message || "Documents saved.");
        }
        return updated;
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            await persistDocuments();
        } catch (saveError) {
            setError(saveError.message || "Could not save documents.");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            const payload = isDirty ? buildDocumentsPayload() : undefined;
            const { verification: updated, message } = await verificationApi.submit(payload);
            applyVerificationMeta(updated);
            onNotify?.(message || "Verification submitted.");
        } catch (submitError) {
            setError(submitError.message || "Could not submit verification.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-[#5c6658]">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading verification center...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[#154212]">
                        <ShieldCheck size={22} />
                        <h2 className="text-xl sm:text-2xl font-bold text-[#191c1c]">
                            Verification Center
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-[#5c6658] max-w-2xl">
                        Upload your government ID, business permit, and junkshop photos. After admin
                        approval, your shop can appear on the public map.
                    </p>
                </div>
                <StatusPill status={status} />
            </div>

            {isApproved && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <span>
                        Your junkshop is verified. Finish shop setup in Settings if anything is still
                        missing.
                    </span>
                </div>
            )}

            {status === "rejected" && verification?.verificationRejectNote && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                    <p className="font-semibold">Admin feedback</p>
                    <p className="mt-1">{verification.verificationRejectNote}</p>
                </div>
            )}

            {isPending && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
                    Your documents are under review. You can still update shop settings while you wait.
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            <DocumentSection
                title="Government ID"
                description="Upload a valid photo of your government-issued ID."
            >
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[#42493e]">ID type</label>
                        <select
                            value={govType}
                            disabled={!canEdit}
                            onChange={(e) => {
                                setGovType(e.target.value);
                                markDirty();
                            }}
                            className={selectClass}
                        >
                            <option value="">Select ID type</option>
                            {govTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <ImageDocumentUpload
                        label="ID photo"
                        preview={govPreview}
                        disabled={!canEdit}
                        onError={setError}
                        onPreviewChange={(preview, fileName, mimeType) => {
                            setGovPreview(preview);
                            setGovFileName(fileName || "");
                            setGovMime(mimeType || "");
                            markDirty();
                        }}
                        onClear={() => {
                            setGovPreview("");
                            setGovFileName("");
                            setGovMime("");
                            markDirty();
                        }}
                        helperText="Upload front of ID"
                        alt="Government ID preview"
                    />
                </div>
            </DocumentSection>

            <DocumentSection
                title="Business permit"
                description="Upload one of the accepted business registration or permit documents."
            >
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[#42493e]">
                            Permit type
                        </label>
                        <select
                            value={permitType}
                            disabled={!canEdit}
                            onChange={(e) => {
                                setPermitType(e.target.value);
                                markDirty();
                            }}
                            className={selectClass}
                        >
                            <option value="">Select permit type</option>
                            {permitTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <ImageDocumentUpload
                        label="Permit photo"
                        preview={permitPreview}
                        disabled={!canEdit}
                        onError={setError}
                        onPreviewChange={(preview, fileName, mimeType) => {
                            setPermitPreview(preview);
                            setPermitFileName(fileName || "");
                            setPermitMime(mimeType || "");
                            markDirty();
                        }}
                        onClear={() => {
                            setPermitPreview("");
                            setPermitFileName("");
                            setPermitMime("");
                            markDirty();
                        }}
                        helperText="Upload permit or registration"
                        alt="Business permit preview"
                    />
                </div>
            </DocumentSection>

            <DocumentSection
                title="Junkshop photos"
                description="Add at least one front-view photo with signage. Two optional extra photos help admins verify your shop faster."
            >
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {photoSlots.map((slotDef) => (
                        <div key={slotDef.slot} className="space-y-2">
                            <p className="text-xs font-semibold text-[#42493e]">
                                {slotDef.label}
                                {slotDef.required && <span className="text-red-600"> *</span>}
                            </p>
                            <ImageDocumentUpload
                                preview={photoPreviews[slotDef.slot]}
                                disabled={!canEdit}
                                onError={setError}
                                onPreviewChange={(preview, fileName, mimeType) => {
                                    setPhotoPreviews((prev) => ({
                                        ...prev,
                                        [slotDef.slot]: preview,
                                    }));
                                    setPhotoMeta((prev) => ({
                                        ...prev,
                                        [slotDef.slot]: {
                                            fileName: fileName || "",
                                            mimeType: mimeType || "",
                                        },
                                    }));
                                    markDirty();
                                }}
                                onClear={() => {
                                    setPhotoPreviews((prev) => ({ ...prev, [slotDef.slot]: "" }));
                                    setPhotoMeta((prev) => ({
                                        ...prev,
                                        [slotDef.slot]: { fileName: "", mimeType: "" },
                                    }));
                                    markDirty();
                                }}
                                helperText="Tap to upload photo"
                                alt={`${slotDef.label} preview`}
                            />
                        </div>
                    ))}
                </div>
            </DocumentSection>

            {canEdit && (
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || submitting}
                        className="inline-flex items-center justify-center rounded-xl border border-[#c2c9bb] bg-white px-5 py-2.5 text-sm font-semibold text-[#191c1c] hover:bg-zinc-50 disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save draft
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving || submitting}
                        className="inline-flex items-center justify-center rounded-xl bg-[#154212] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3310] disabled:opacity-60"
                    >
                        {submitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Submit for review
                    </button>
                </div>
            )}
        </div>
    );
}

function StatusPill({ status }) {
    const styles = {
        draft: "bg-amber-100 text-amber-900 border-amber-200",
        pending: "bg-sky-100 text-sky-900 border-sky-200",
        approved: "bg-emerald-100 text-emerald-900 border-emerald-200",
        rejected: "bg-red-100 text-red-900 border-red-200",
    };

    const labels = {
        draft: "Draft",
        pending: "Pending review",
        approved: "Approved",
        rejected: "Needs updates",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                styles[status] || styles.draft
            }`}
        >
            {labels[status] || status}
        </span>
    );
}
