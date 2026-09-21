"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  CREDENTIAL_TYPES,
  isOtherPlatform,
  PLATFORMS,
} from "@/lib/platforms";
import type { Credential, CredentialInput } from "@/lib/types";

interface CredentialModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CredentialInput) => Promise<void>;
  credential?: Credential | null;
}

const emptyForm: CredentialInput = {
  platform: "other",
  custom_platform_name: "",
  credential_type: "username_password",
  username: "",
  email: "",
  password: "",
  description: "",
  website_url: "",
};

export default function CredentialModal({
  open,
  onClose,
  onSave,
  credential,
}: CredentialModalProps) {
  const [form, setForm] = useState<CredentialInput>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (credential) {
      setForm({
        platform: credential.platform === "custom" ? "other" : credential.platform,
        custom_platform_name: credential.custom_platform_name || "",
        credential_type: credential.credential_type,
        username: credential.username || "",
        email: credential.email || "",
        password: credential.password,
        description: credential.description || "",
        website_url: credential.website_url || "",
      });
    } else {
      setForm(emptyForm);
    }
    setShowPassword(false);
    setFormError("");
  }, [credential, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isOtherPlatform(form.platform) && !form.custom_platform_name?.trim()) {
      setFormError("Enter a name for this platform when using Other.");
      return;
    }
    setFormError("");
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const showUsername =
    form.credential_type === "username_password" ||
    form.credential_type === "other";
  const showEmail =
    form.credential_type === "email_password" ||
    form.credential_type === "other";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {credential ? "Edit Credential" : "Add Credential"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Platform
                  </label>
                  <select
                    value={form.platform}
                    onChange={(e) => {
                      const platform = e.target.value;
                      setForm({
                        ...form,
                        platform,
                        custom_platform_name: isOtherPlatform(platform)
                          ? form.custom_platform_name
                          : "",
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Type
                  </label>
                  <select
                    value={form.credential_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        credential_type: e.target
                          .value as CredentialInput["credential_type"],
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
                  >
                    {CREDENTIAL_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isOtherPlatform(form.platform) && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Platform name
                  </label>
                  <input
                    type="text"
                    value={form.custom_platform_name}
                    onChange={(e) =>
                      setForm({ ...form, custom_platform_name: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
                    placeholder="e.g. My VPS provider, Client portal…"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    This label appears in the table and extension.
                  </p>
                </div>
              )}

              {formError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {formError}
                </p>
              )}

              {showUsername && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Username
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
                    placeholder="johndoe"
                  />
                </div>
              )}

              {showEmail && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
                    placeholder="you@example.com"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  {form.credential_type === "api_key"
                    ? "API Key"
                    : form.credential_type === "token"
                      ? "Token / Secret"
                      : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
                  placeholder="What is this credential for?"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Website URL (optional)
                </label>
                <input
                  type="url"
                  value={form.website_url}
                  onChange={(e) =>
                    setForm({ ...form, website_url: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-slate-800 to-slate-950 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:from-slate-100 dark:to-slate-300 dark:text-slate-900"
                >
                  {loading ? "Saving..." : credential ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
