"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthenticatedUser } from "@/types/auth";
import type { TranslateFn } from "@/types/i18n";

type TeamMember = {
  id: number;
  email: string;
  role: "Admin" | "Manager" | "Viewer";
  createdAt: string;
};

type PendingInvitation = {
  id: number;
  email: string;
  role: "Manager" | "Viewer";
  createdAt: string;
};

type SettingsTeamMembersCardProps = {
  t: TranslateFn;
  user: AuthenticatedUser;
};

function RoleBadge({ role, t }: { role: string; t: TranslateFn }) {
  const styles: Record<string, string> = {
    Admin: "bg-blue-600 text-white",
    Manager: "bg-emerald-600 text-white",
    Viewer: "bg-neutral-400 text-white",
  };
  const labels: Record<string, string> = {
    Admin: t("Administrator"),
    Manager: t("Manager"),
    Viewer: t("Viewer"),
  };
  return (
    <span
      className={`inline-flex h-5 items-center rounded-[10px] px-2 text-[10px] font-semibold ${styles[role] ?? "bg-neutral-300 text-neutral-700"}`}
    >
      {labels[role] ?? role}
    </span>
  );
}

function InviteForm({
  t,
  onSuccess,
}: {
  t: TranslateFn;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Manager" | "Viewer">("Manager");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/company/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          message?: string;
          detail?: string;
          title?: string;
        } | null;
        throw new Error(
          payload?.message ??
            payload?.detail ??
            payload?.title ??
            t("Failed to send invitation."),
        );
      }

      setEmail("");
      setRole("Manager");
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("Failed to send invitation."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-3 space-y-3">
      {error && (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("Email address")}
          className="h-9 min-w-0 flex-1 rounded-[8px] border border-neutral-200 bg-white px-3 text-sm leading-5 tracking-[-0.1504px] text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "Manager" | "Viewer")}
          className="h-9 rounded-[8px] border border-neutral-200 bg-white px-3 text-sm leading-5 tracking-[-0.1504px] text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Manager">{t("Manager")}</option>
          <option value="Viewer">{t("Viewer")}</option>
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-9 items-center justify-center rounded-[8px] bg-blue-600 px-4 text-sm font-semibold tracking-[-0.1504px] text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? t("Sending…") : t("Send invite")}
        </button>
      </div>
    </form>
  );
}

export function SettingsTeamMembersCard({
  t,
  user,
}: SettingsTeamMembersCardProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoadError("");

    void Promise.all([
      fetch("/api/company/members", { cache: "no-store" }),
      fetch("/api/company/invitations", { cache: "no-store" }),
    ])
      .then(async ([membersRes, invitesRes]) => {
        if (!membersRes.ok || !invitesRes.ok) {
          throw new Error(t("Unable to load team members right now."));
        }
        const [membersData, invitesData] = await Promise.all([
          membersRes.json() as Promise<TeamMember[]>,
          invitesRes.json() as Promise<PendingInvitation[]>,
        ]);
        setMembers(membersData);
        setInvitations(invitesData);
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : t("Unable to load team members right now."),
        );
      });
  }, [t]);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/company/invitations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setInvitations((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // silently fail — user can retry
    } finally {
      setCancellingId(null);
    }
  };

  if (user.appRole !== "Admin") return null;

  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Team members")}
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-blue-600 px-3 text-[13px] font-semibold text-white transition hover:bg-blue-700"
        >
          <span className="text-base leading-none">+</span>
          {t("Invite")}
        </button>
      </div>

      {showForm && (
        <InviteForm
          t={t}
          onSuccess={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loadError ? (
        <div className="mt-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 inline-flex h-8 items-center rounded-[8px] border border-red-200 bg-white px-3 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
          >
            {t("Try again")}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-neutral-200 bg-[#fafafa] px-3 py-2.5"
            >
              <p className="min-w-0 truncate text-sm leading-5 tracking-[-0.1504px] text-neutral-900">
                {member.email}
                {member.email === (user.email ?? user.preferredUsername) && (
                  <span className="ml-1.5 text-[11px] text-neutral-500">
                    ({t("you")})
                  </span>
                )}
              </p>
              <RoleBadge role={member.role} t={t} />
            </div>
          ))}

          {invitations.length > 0 && (
            <>
              <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                {t("Pending invitations")}
              </p>
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-[10px] border border-dashed border-neutral-300 bg-[#fafafa] px-3 py-2.5"
                >
                  <p className="min-w-0 truncate text-sm leading-5 tracking-[-0.1504px] text-neutral-500">
                    {inv.email}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <RoleBadge role={inv.role} t={t} />
                    <span className="inline-flex h-5 items-center rounded-[10px] border border-amber-300 bg-amber-50 px-2 text-[10px] font-semibold text-amber-700">
                      {t("Pending")}
                    </span>
                    <button
                      type="button"
                      disabled={cancellingId === inv.id}
                      onClick={() => void handleCancel(inv.id)}
                      className="text-[11px] font-semibold text-red-500 transition hover:text-red-700 disabled:opacity-50"
                    >
                      {t("Cancel")}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {members.length === 0 && invitations.length === 0 && (
            <p className="text-xs text-neutral-500">
              {t("No team members yet.")}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
