"use client";

import { Folder, FolderPlus, Layers, Pencil, Shield, Trash2 } from "lucide-react";
import type { VaultFile } from "@/lib/types";

interface FilesSidebarProps {
  username: string;
  files: VaultFile[];
  loading: boolean;
  selectedFileId: string | null;
  onSelect: (id: string | null) => void;
  onNewFile: () => void;
  onEditFile: (file: VaultFile) => void;
  onDeleteFile: (file: VaultFile) => void;
}

export default function FilesSidebar({
  username,
  files,
  loading,
  selectedFileId,
  onSelect,
  onNewFile,
  onEditFile,
  onDeleteFile,
}: FilesSidebarProps) {
  const navItemClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
      active
        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
    }`;

  return (
    <aside className="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-5 dark:border-white/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-slate-900 dark:text-white">
            Credential Vault
          </h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            Welcome, {username}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <button
          onClick={() => onSelect(null)}
          className={navItemClass(selectedFileId === null)}
        >
          <Layers className="h-4 w-4 shrink-0" />
          Dashboard
        </button>

        <div className="mb-2 mt-6 flex items-center justify-between px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Company Files
          </span>
          <button
            onClick={onNewFile}
            title="New company file"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1">
          {loading ? (
            <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">
              Loading…
            </p>
          ) : (
            files.map((file) => (
              <div key={file.id} className="group relative">
                <button
                  onClick={() => onSelect(file.id)}
                  className={navItemClass(selectedFileId === file.id)}
                >
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs opacity-60 group-hover:opacity-0">
                    {file.credential_count}
                  </span>
                </button>
                <div className="absolute right-1 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditFile(file);
                    }}
                    title="Rename"
                    className={`rounded-lg p-1.5 ${
                      selectedFileId === file.id
                        ? "text-white/70 hover:bg-white/10 hover:text-white dark:text-slate-900/70 dark:hover:bg-slate-900/10 dark:hover:text-slate-900"
                        : "text-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file);
                    }}
                    title="Delete"
                    className={`rounded-lg p-1.5 ${
                      selectedFileId === file.id
                        ? "text-white/70 hover:bg-white/10 hover:text-red-300 dark:text-slate-900/70 dark:hover:bg-slate-900/10 dark:hover:text-red-600"
                        : "text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}

          {!loading && files.length === 0 && (
            <button
              onClick={onNewFile}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-left text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 dark:border-white/15 dark:text-slate-400 dark:hover:border-white/25 dark:hover:text-slate-200"
            >
              <FolderPlus className="h-4 w-4 shrink-0" />
              New company file
            </button>
          )}
        </div>
      </nav>
    </aside>
  );
}
