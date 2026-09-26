"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Folder,
  LogOut,
  Pencil,
  Plus,
  Puzzle,
  Search,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import CredentialModal from "./CredentialModal";
import FileModal from "./FileModal";
import FilesSidebar from "./FilesSidebar";
import PlatformIcon from "./PlatformIcon";
import GradientWaves from "./ui/gradient-waves";
import { ThemeToggle } from "./ui/theme-toggle";
import {
  CREDENTIAL_TYPES,
  DEFAULT_FILE_PLATFORMS,
  getPlatform,
  getPlatformDisplayName,
  PLATFORMS,
} from "@/lib/platforms";
import type {
  Credential,
  CredentialInput,
  VaultFile,
  VaultFileInput,
} from "@/lib/types";

interface VaultDashboardProps {
  username: string;
}

// Seeded platforms show first, in this fixed order, then everything else
// keeps its normal (most-recently-updated-first) order.
const DEFAULT_PLATFORM_ORDER = new Map(
  DEFAULT_FILE_PLATFORMS.map((p, i) => [p.platform, i]),
);

export default function VaultDashboard({ username }: VaultDashboardProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
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
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<VaultFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: "credential"; id: string } | { type: "file"; file: VaultFile } | null
  >(null);

  const fetchFiles = useCallback(async () => {
    const res = await fetch("/api/files");
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files);
    }
    setFilesLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchFiles, 0);
    return () => clearTimeout(timer);
  }, [fetchFiles]);

  // When no specific file is open, the dashboard shows every credential.
  const scopeFileId = selectedFileId ?? "all";

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (scopeFileId !== "all") params.set("file_id", scopeFileId);
    if (platformFilter !== "all") params.set("platform", platformFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/credentials?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCredentials(data.credentials);
    }
    setLoading(false);
  }, [scopeFileId, platformFilter, typeFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchCredentials, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchCredentials, search]);

  // Seeded placeholders (empty password, not yet filled in) don't count
  // as real credentials until the user actually fills them in.
  const stats = useMemo(() => {
    const filled = credentials.filter((c) => c.password !== "");
    return {
      total: filled.length,
      platforms: new Set(filled.map((c) => c.platform)).size,
    };
  }, [credentials]);

  const filteredCredentials = useMemo(() => {
    let result = credentials;
    // The Dashboard (no file open) shows every credential across every
    // file, so unfilled placeholders would otherwise clutter it. Inside a
    // specific company file they stay visible so they can be filled in.
    if (selectedFileId === null) {
      result = result.filter((c) => c.password !== "");
    }
    if (activeTab !== "all") {
      result = result.filter(c => getPlatform(c.platform).category === activeTab);
    }
    // The fixed seeded-platform order only applies inside a company file;
    // the Dashboard keeps its normal (most-recently-updated-first) order.
    if (selectedFileId !== null) {
      result = [...result].sort((a, b) => {
        const ai = DEFAULT_PLATFORM_ORDER.get(a.platform) ?? Infinity;
        const bi = DEFAULT_PLATFORM_ORDER.get(b.platform) ?? Infinity;
        return ai - bi;
      });
    }
    return result;
  }, [credentials, activeTab, selectedFileId]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredCredentials.length / ITEMS_PER_PAGE) || 1;
  const paginatedCredentials = filteredCredentials.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, platformFilter, typeFilter]);

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
      void fetchFiles();
      setEditing(null);
    }
  }

  async function performDeleteCredential(id: string) {
    // Remove it from view immediately; reconcile with the server in the
    // background instead of blocking the UI on a round trip.
    setCredentials((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/credentials/${id}`, { method: "DELETE" });
    void Promise.all([fetchCredentials(), fetchFiles()]);
  }

  async function handleSaveFile(data: VaultFileInput) {
    const url = editingFile ? `/api/files/${editingFile.id}` : "/api/files";
    const method = editingFile ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const { file } = await res.json();
      setFiles((prev) => {
        const next = editingFile
          ? prev.map((f) => (f.id === file.id ? file : f))
          : [...prev, file];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      setEditingFile(null);
    }
  }

  async function performDeleteFile(file: VaultFile) {
    // Same idea: drop it from the sidebar right away.
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    if (selectedFileId === file.id) setSelectedFileId(null);
    await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    void fetchFiles();
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
    <div className="relative flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="fixed inset-0 z-0">
        <GradientWaves
          horizonColor={isDark ? "#020617" : "#f8fafc"}
          waveColor={isDark ? "#475569" : "#cbd5e1"}
          crestColor={isDark ? "#94a3b8" : "#ffffff"}
          speed={0.3}
          amplitude={2}
          waveScale={0.6}
          waveRatio={0.9}
          swell={30}
          turbulence={15}
          brightness={1}
          opacity={0.45}
          detail="low"
          mouseInteraction={false}
          grain
          grainIntensity={0.03}
        />
      </div>

      <FilesSidebar
        username={username}
        files={files}
        loading={filesLoading}
        selectedFileId={selectedFileId}
        onSelect={setSelectedFileId}
        onNewFile={() => {
          setEditingFile(null);
          setFileModalOpen(true);
        }}
        onEditFile={(file) => {
          setEditingFile(file);
          setFileModalOpen(true);
        }}
        onDeleteFile={(file) => setDeleteTarget({ type: "file", file })}
      />

      <div className="relative z-10 min-w-0 flex-1">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="flex items-center justify-end gap-2 px-6 py-4">
            <ThemeToggle />
            <button
              onClick={() => setShowExtensionPanel(!showExtensionPanel)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <Puzzle className="h-4 w-4" />
              Extension
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
        </div>
      </header>

      <AnimatePresence>
        {showExtensionPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 overflow-hidden border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"
          >
            <div className="mx-auto max-w-7xl px-6 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Generate an API token for the browser extension. Load the{" "}
                <code className="rounded bg-slate-900/5 px-1.5 py-0.5 text-xs dark:bg-white/10">
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
                    className="rounded-lg bg-slate-900/10 px-3 py-2 text-xs text-slate-900 dark:bg-white/10 dark:text-white"
                  >
                    {copiedId === "token" ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateExtensionToken}
                  className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300"
                >
                  Generate Extension Token
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {selectedFileId !== null && (
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <Folder className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {files.find((f) => f.id === selectedFileId)?.name || "…"}
            </h2>
          </div>
        )}

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
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "all", label: "All" },
            { id: "websites", label: "Websites" },
            { id: "tools", label: "Tools & Cloud" },
            { id: "social", label: "Social" },
            { id: "email", label: "Email" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search credentials..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500"
              />
            </div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
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
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 dark:from-slate-100 dark:to-slate-300 dark:text-slate-900"
          >
            <Plus className="h-4 w-4" />
            Add Credential
          </motion.button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.02]">
                  {["Platform", "Account", "Secret", "Description", "Type", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
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
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400">
                      Loading credentials...
                    </td>
                  </tr>
                ) : filteredCredentials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <p className="text-slate-500 dark:text-slate-400">No credentials found</p>
                      <button
                        onClick={() => {
                          setEditing(null);
                          setModalOpen(true);
                        }}
                        className="mt-3 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        Add your first credential
                      </button>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {paginatedCredentials.map((cred, index) => {
                      const platform = getPlatform(cred.platform);
                      const platformLabel = getPlatformDisplayName(
                        cred.platform,
                        cred.custom_platform_name,
                      );
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
                          className="group border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <PlatformIcon
                                platform={cred.platform}
                                customLabel={cred.custom_platform_name}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {platformLabel}
                                </p>
                                {cred.website_url && (
                                  <a
                                    href={cred.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                                  >
                                    Visit
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-mono text-sm text-slate-700 dark:text-slate-200">
                              {getPrimaryLabel(cred)}
                            </p>
                            {cred.username && cred.email && (
                              <p className="text-xs text-slate-500 dark:text-slate-500">{cred.email}</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="max-w-[140px] truncate font-mono text-sm text-slate-600 dark:text-slate-300">
                                {isVisible ? cred.password : "••••••••••••"}
                              </span>
                              <button
                                onClick={() => togglePassword(cred.id)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-white"
                              >
                                {isVisible ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => copyText(cred.password, cred.id)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-white"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              {copiedId === cred.id && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">Copied</span>
                              )}
                            </div>
                          </td>
                          <td className="max-w-[200px] px-5 py-4">
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                              {cred.description || "—"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
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
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({ type: "credential", id: cred.id })
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
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

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/10">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredCredentials.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{filteredCredentials.length}</span> credentials
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      <CredentialModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        credential={editing}
        files={files}
        defaultFileId={selectedFileId}
      />

      <FileModal
        open={fileModalOpen}
        onClose={() => {
          setFileModalOpen(false);
          setEditingFile(null);
        }}
        onSave={handleSaveFile}
        file={editingFile}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={
          deleteTarget?.type === "file"
            ? `Delete "${deleteTarget.file.name}"?`
            : "Delete this credential?"
        }
        description={
          deleteTarget?.type === "file"
            ? `Its ${deleteTarget.file.credential_count} credential(s) will become unfiled, not deleted.`
            : "This will permanently remove the credential. This can't be undone."
        }
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "credential") {
            await performDeleteCredential(deleteTarget.id);
          } else {
            await performDeleteFile(deleteTarget.file);
          }
          setDeleteTarget(null);
        }}
      />
      </div>
    </div>
  );
}
