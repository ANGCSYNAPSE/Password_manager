"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { CREDENTIAL_TYPES, PLATFORMS } from "@/lib/platforms";
import type { Credential, CredentialInput } from "@/lib/types";

interface CredentialModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CredentialInput) => Promise<void>;
  credential?: Credential | null;
}

const emptyForm: CredentialInput = {
  platform: "custom",
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

  useEffect(() => {
    if (credential) {
      setForm({
        platform: credential.platform,
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
  }, [credential, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {credential ? "Edit Credential" : "Add Credential"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Platform
                  </label>
                  <select
                    value={form.platform}
                    onChange={(e) =>
                      setForm({ ...form, platform: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
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
                    className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                  >
                    {CREDENTIAL_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {showUsername && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Username
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                    placeholder="johndoe"
                  />
                </div>
              )}

              {showEmail && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
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
                    className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2.5 pr-10 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
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
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                  placeholder="What is this credential for?"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Website URL (optional)
                </label>
                <input
                  type="url"
                  value={form.website_url}
                  onChange={(e) =>
                    setForm({ ...form, website_url: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
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
