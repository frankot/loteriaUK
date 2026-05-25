"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateUser } from "@/actions/admin";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditUserFormProps {
  locale: string;
  userId: string;
  defaultValues: {
    name: string;
    address: string;
    phone: string;
    dateOfBirth: string;
    email: string;
  };
}

export function EditUserForm({
  locale,
  userId,
  defaultValues,
}: EditUserFormProps) {
  const router = useRouter();
  const [name, setName] = useState(defaultValues.name);
  const [address, setAddress] = useState(defaultValues.address);
  const [phone, setPhone] = useState(defaultValues.phone);
  const [dateOfBirth, setDateOfBirth] = useState(defaultValues.dateOfBirth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccess(false);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("address", address);
      fd.set("phone", phone);
      if (dateOfBirth) fd.set("dateOfBirth", dateOfBirth);

      const result = await adminUpdateUser(userId, fd);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push(`/${locale}/admin/users`), 1200);
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email (read-only) */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          type="email"
          value={defaultValues.email}
          readOnly
          className="w-full rounded-xl border border-border bg-cream-warm px-4 py-3 text-sm text-ink-muted cursor-not-allowed"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass("name")}
          required
        />
        {fieldErrors.name && (
          <p className="mt-1 text-xs text-urgent">{fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Address *
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputClass("address")}
          required
        />
        {fieldErrors.address && (
          <p className="mt-1 text-xs text-urgent">{fieldErrors.address}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Phone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass("phone")}
        />
        {fieldErrors.phone && (
          <p className="mt-1 text-xs text-urgent">{fieldErrors.phone}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Date of Birth
        </label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className={inputClass("dateOfBirth")}
        />
        {fieldErrors.dateOfBirth && (
          <p className="mt-1 text-xs text-urgent">{fieldErrors.dateOfBirth}</p>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-success/10 px-4 py-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <p className="text-sm font-medium text-success">User updated successfully</p>
        </div>
      )}

      {error && !Object.keys(fieldErrors).length && (
        <div className="rounded-xl bg-urgent/10 px-4 py-3">
          <p className="text-sm text-urgent">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Link
          href={`/${locale}/admin/users`}
          className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-3 text-sm font-medium text-ink-muted transition-colors hover:border-gold hover:text-gold-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-ink px-6 py-3 font-medium text-sm text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
