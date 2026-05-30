"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createCompetition, updateCompetition, uploadImage, deleteImage } from "@/actions/admin";
// Local type definitions — Prisma generated types not available on Vercel
type CompetitionStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "DRAWN" | "CANCELLED";
interface SkillQuestion { id: string; questionEn: string; }

interface CompetitionFormData {
  titleEn: string;
  titlePl: string;
  titleRo: string;
  titleBg: string;
  slug: string;
  descEn: string;
  descPl: string;
  descRo: string;
  descBg: string;
  pricePounds: string;
  maxTickets: string;
  drawDate: string;
  prizeImageUrl: string;
  prizeCategory: string;
  prizeValue: string;
  questionId: string;
  featured: boolean;
  status: CompetitionStatus;
}

interface CompetitionFormProps {
  locale: string;
  questions: Pick<SkillQuestion, "id" | "questionEn">[];
  defaultValues?: CompetitionFormData;
  competitionId?: string; // if editing
}

const defaultForm: CompetitionFormData = {
  titleEn: "",
  titlePl: "",
  titleRo: "",
  titleBg: "",
  slug: "",
  descEn: "",
  descPl: "",
  descRo: "",
  descBg: "",
  pricePounds: "1.99",
  maxTickets: "500",
  drawDate: "",
  prizeImageUrl: "",
  prizeCategory: "",
  prizeValue: "",
  questionId: "",
  featured: false,
  status: "DRAFT",
};

const statusOptions: { value: CompetitionStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
  { value: "DRAWN", label: "Drawn" },
  { value: "CANCELLED", label: "Cancelled" },
];

const categoryOptions = ["", "electronics", "jewellery", "fashion", "cash"];

export function CompetitionForm({
  locale,
  questions,
  defaultValues,
  competitionId,
}: CompetitionFormProps) {
  const router = useRouter();
  const isEdit = !!competitionId;

  const [form, setForm] = useState<CompetitionFormData>(
    defaultValues || defaultForm
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [imageUploading, setImageUploading] = useState(false);

  function update(field: keyof CompetitionFormData, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from titleEn
      if (field === "titleEn" && !isEdit && typeof value === "string") {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
      }
      return next;
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Pass old image URL so the old object gets deleted from R2
      if (form.prizeImageUrl) {
        fd.append("oldUrl", form.prizeImageUrl);
      }
      const result = await uploadImage(fd);
      if (result.url) {
        update("prizeImageUrl", result.url);
      } else if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleRemoveImage() {
    if (form.prizeImageUrl) {
      const result = await deleteImage(form.prizeImageUrl);
      if (result.error) console.error("Remove image error:", result.error);
    }
    update("prizeImageUrl", "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const fd = new FormData();
      for (const [key, value] of Object.entries(form)) {
        fd.append(key, String(value));
      }

      const result = isEdit
        ? await updateCompetition(competitionId!, fd)
        : await createCompetition(fd);

      if (result.success) {
        router.push(`/${locale}/admin/competitions`);
      } else {
        setError(result.error || "Failed to save");
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    } catch {
      setError("Failed to save");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold-pale ${
      fieldErrors[field] ? "border-urgent" : "border-border"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Title Section */}
      <section className="rounded-xl border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gold-dark uppercase">
          Title &amp; Slug
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Title (EN) *
            </label>
            <input
              type="text"
              value={form.titleEn}
              onChange={(e) => update("titleEn", e.target.value)}
              className={inputClass("titleEn")}
            />
            {fieldErrors.titleEn && (
              <p className="mt-1 text-xs text-urgent">{fieldErrors.titleEn}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Slug *
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              className={inputClass("slug")}
            />
            {fieldErrors.slug && (
              <p className="mt-1 text-xs text-urgent">{fieldErrors.slug}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Title (PL)
            </label>
            <input
              type="text"
              value={form.titlePl}
              onChange={(e) => update("titlePl", e.target.value)}
              className={inputClass("titlePl")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Title (RO)
            </label>
            <input
              type="text"
              value={form.titleRo}
              onChange={(e) => update("titleRo", e.target.value)}
              className={inputClass("titleRo")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Title (BG)
            </label>
            <input
              type="text"
              value={form.titleBg}
              onChange={(e) => update("titleBg", e.target.value)}
              className={inputClass("titleBg")}
            />
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="rounded-xl border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gold-dark uppercase">
          Description
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(["En", "Pl", "Ro", "Bg"] as const).map((lang) => (
            <div key={lang}>
              <label className="mb-1 block text-xs font-medium text-ink-muted">
                Description ({lang})
              </label>
              <textarea
                value={form[`desc${lang}` as keyof CompetitionFormData] as string}
                onChange={(e) =>
                  update(`desc${lang}` as keyof CompetitionFormData, e.target.value)
                }
                rows={3}
                className={inputClass(`desc${lang}`)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Pricing & Draw */}
      <section className="rounded-xl border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gold-dark uppercase">
          Pricing &amp; Draw
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Price (£) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.pricePounds}
              onChange={(e) => update("pricePounds", e.target.value)}
              className={inputClass("pricePounds")}
            />
            {fieldErrors.pricePounds && (
              <p className="mt-1 text-xs text-urgent">{fieldErrors.pricePounds}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Max Tickets *
            </label>
            <input
              type="number"
              min="1"
              value={form.maxTickets}
              onChange={(e) => update("maxTickets", e.target.value)}
              className={inputClass("maxTickets")}
            />
            {fieldErrors.maxTickets && (
              <p className="mt-1 text-xs text-urgent">{fieldErrors.maxTickets}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Draw Date *
            </label>
            <input
              type="datetime-local"
              value={form.drawDate}
              onChange={(e) => update("drawDate", e.target.value)}
              className={inputClass("drawDate")}
            />
            {fieldErrors.drawDate && (
              <p className="mt-1 text-xs text-urgent">{fieldErrors.drawDate}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className={inputClass("status")}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Prize Details */}
      <section className="rounded-xl border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gold-dark uppercase">
          Prize Details
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Category
            </label>
            <select
              value={form.prizeCategory}
              onChange={(e) => update("prizeCategory", e.target.value)}
              className={inputClass("prizeCategory")}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat || "None"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Prize Value (£)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.prizeValue}
              onChange={(e) => update("prizeValue", e.target.value)}
              className={inputClass("prizeValue")}
              placeholder="RRP"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Question
            </label>
            <select
              value={form.questionId}
              onChange={(e) => update("questionId", e.target.value)}
              className={inputClass("questionId")}
            >
              <option value="">None</option>
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.questionEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Featured toggle */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-gold-pale bg-gold-pale/30 px-4 py-3">
          <input
            type="checkbox"
            id="featured"
            checked={form.featured}
            onChange={(e) => update("featured", e.target.checked)}
            className="h-5 w-5 cursor-pointer rounded border-border text-gold accent-gold"
          />
          <label htmlFor="featured" className="cursor-pointer text-sm font-medium text-ink">
            ⭐ Feature this competition on the homepage hero
          </label>
          <span className="ml-auto text-xs text-ink-muted">
            Only one can be featured at a time
          </span>
        </div>
      </section>

      {/* Image Upload */}
      <section className="rounded-xl border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gold-dark uppercase">
          Prize Image
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Image URL
            </label>
            <input
              type="text"
              value={form.prizeImageUrl}
              onChange={(e) => update("prizeImageUrl", e.target.value)}
              className={inputClass("prizeImageUrl")}
              placeholder="https://... or /uploads/..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">
              Or Upload
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleImageUpload}
              disabled={imageUploading}
              className="text-sm text-ink-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink hover:file:border-gold"
            />
            {imageUploading && (
              <p className="mt-1 text-xs text-gold-dark">Uploading...</p>
            )}
          </div>
        </div>
        {form.prizeImageUrl && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-ink-muted">Preview:</p>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="rounded-lg border border-urgent/30 px-2 py-0.5 text-xs font-medium text-urgent transition-colors hover:bg-urgent/10"
              >
                Remove
              </button>
            </div>
            <img
              src={form.prizeImageUrl}
              alt="Preview"
              className="h-32 w-32 rounded-lg border border-border object-contain bg-cream-warm"
            />
          </div>
        )}
      </section>

      {/* Submit */}
      {error && !Object.keys(fieldErrors).length && (
        <div className="rounded-xl bg-urgent/10 px-4 py-3">
          <p className="text-sm text-urgent">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-ink px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : isEdit
            ? "Update Competition"
            : "Create Competition"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/competitions`)}
          className="rounded-xl border border-border px-8 py-3 text-sm font-medium text-ink-muted transition-colors hover:border-gold hover:text-gold-dark"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
