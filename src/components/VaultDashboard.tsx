"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  Pencil,
  Plus,
  Puzzle,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import CredentialModal from "./CredentialModal";
import PlatformIcon from "./PlatformIcon";
import { CREDENTIAL_TYPES, getPlatform, PLATFORMS } from "@/lib/platforms";
import type { Credential, CredentialInput } from "@/lib/types";

interface VaultDashboardProps {
  username: string;
}

export default function VaultDashboard({ username }: VaultDashboardProps) {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set(),
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extensionToken, setExtensionToken] = useState<string | null>(null);
  const [showExtensionPanel, setShowExtensionPanel] = useState(false);

  const fetchCredentials = useCallback(async () => {
    const params = new URLSearchParams();
    if (platformFilter !== "all") params.set("platform", platformFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/credentials?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCredentials(data.credentials);
    }
    setLoading(false);
  }, [platformFilter, typeFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchCredentials, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchCredentials, search]);

  const stats = useMemo(
    () => ({
      total: credentials.length,
      platforms: new Set(credentials.map((c) => c.platform)).size,
    }),
    [credentials],
  );

  async function handleSave(data: CredentialInput) {
    const url = editing
      ? `/api/credentials/${editing.id}`
      : "/api/credentials";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      await fetchCredentials();
      setEditing(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this credential permanently?")) return;
    await fetch(`/api/credentials/${id}`, { method: "DELETE" });
    await fetchCredentials();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function generateExtensionToken() {
    const res = await fetch("/api/extension/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Browser Extension" }),
    });
    if (res.ok) {
      const data = await res.json();
      setExtensionToken(data.token);
    }
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function togglePassword(id: string) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getPrimaryLabel(c: Credential) {
    if (c.credential_type === "email_password") return c.email || "—";
    if (c.credential_type === "api_key" || c.credential_type === "token")
      return c.description || "—";
    return c.username || c.email || "—";
  }

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Credential Vault</h1>
              <p className="text-xs text-slate-400">Welcome, {username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExtensionPanel(!showExtensionPanel)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <Puzzle className="h-4 w-4" />
              Extension
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showExtensionPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-white/5 bg-violet-500/5"
          >
            <div className="mx-auto max-w-7xl px-6 py-4">
              <p className="text-sm text-slate-300">
                Generate an API token for the browser extension. Load the{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                  extension/
                </code>{" "}
                folder in Chrome → Extensions → Load unpacked.
              </p>
              {extensionToken ? (
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-slate-900 px-3 py-2 text-xs text-emerald-400">
                    {extensionToken}
                  </code>
                  <button
                    onClick={() => copyText(extensionToken, "token")}
                    className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white"
                  >
                    {copiedId === "token" ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateExtensionToken}
                  className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
                >
                  Generate Extension Token
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Credentials", value: stats.total },
            { label: "Platforms Used", value: stats.platforms },
            { label: "Secure Storage", value: "AES-256" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search credentials..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none"
              />
            </div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="all">All Platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="all">All Types</option>
              {CREDENTIAL_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20"
          >
            <Plus className="h-4 w-4" />
            Add Credential
          </motion.button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {["Platform", "Account", "Secret", "Description", "Type", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                      Loading credentials...
                    </td>
                  </tr>
                ) : credentials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <p className="text-slate-400">No credentials found</p>
                      <button
                        onClick={() => {
                          setEditing(null);
                          setModalOpen(true);
                        }}
                        className="mt-3 text-sm text-violet-400 hover:text-violet-300"
                      >
                        Add your first credential
                      </button>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {credentials.map((cred, index) => {
                      const platform = getPlatform(cred.platform);
                      const typeLabel =
                        CREDENTIAL_TYPES.find((t) => t.id === cred.credential_type)
                          ?.label || cred.credential_type;
                      const isVisible = visiblePasswords.has(cred.id);

                      return (
                        <motion.tr
                          key={cred.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="group border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <PlatformIcon platform={cred.platform} size="sm" />
                              <div>
                                <p className="font-medium text-white">
                                  {platform.label}
                                </p>
                                {cred.website_url && (
                                  <a
                                    href={cred.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400"
                                  >
                                    Visit
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-mono text-sm text-slate-200">
                              {getPrimaryLabel(cred)}
                            </p>
                            {cred.username && cred.email && (
                              <p className="text-xs text-slate-500">{cred.email}</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="max-w-[140px] truncate font-mono text-sm text-slate-300">
                                {isVisible ? cred.password : "••••••••••••"}
                              </span>
                              <button
                                onClick={() => togglePassword(cred.id)}
                                className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white"
                              >
                                {isVisible ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => copyText(cred.password, cred.id)}
                                className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              {copiedId === cred.id && (
                                <span className="text-xs text-emerald-400">Copied</span>
                              )}
                            </div>
                          </td>
                          <td className="max-w-[200px] px-5 py-4">
                            <p className="truncate text-sm text-slate-400">
                              {cred.description || "—"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
                              {typeLabel}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => {
                                  setEditing(cred);
                                  setModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cred.id)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <CredentialModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        credential={editing}
      />
    </div>
  );
}
