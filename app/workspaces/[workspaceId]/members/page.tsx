"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { InviteMemberModal } from "@/components/members/invite-member-modal";
import { Role } from "@prisma/client";
import {
  Users,
  UserPlus,
  Shield,
  User,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

interface MemberItem {
  id: string;
  userId: string;
  role: Role;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface InvitationItem {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: string;
  createdAt: string;
  inviter: {
    id: string;
    name: string | null;
    email: string;
  };
  token: string;
}

export default function WorkspaceMembersPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;
  const { user: currentUser } = useAuth();

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [currentMemberRole, setCurrentMemberRole] = useState<Role | null>(null);
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const reloadMembers = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const data: ApiResponse<{
        members: MemberItem[];
        invitations: InvitationItem[];
        currentMemberRole: Role;
        canManageMembers: boolean;
      }> = await res.json();

      if (data.success) {
        setMembers(data.data.members);
        setInvitations(data.data.invitations || []);
        setCurrentMemberRole(data.data.currentMemberRole);
        setCanManageMembers(data.data.canManageMembers);
      } else {
        setError(data.error.message);
      }
    } catch {
      setError("Failed to load workspace members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);
        const data: ApiResponse<{
          members: MemberItem[];
          invitations: InvitationItem[];
          currentMemberRole: Role;
          canManageMembers: boolean;
        }> = await res.json();

        if (isMounted) {
          if (data.success) {
            setMembers(data.data.members);
            setInvitations(data.data.invitations || []);
            setCurrentMemberRole(data.data.currentMemberRole);
            setCanManageMembers(data.data.canManageMembers);
          } else {
            setError(data.error.message);
          }
        }
      } catch {
        if (isMounted) {
          setError("Failed to load workspace members");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data: ApiResponse<{ member: MemberItem }> = await res.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      setSuccess("Member role updated successfully");
      reloadMembers();
    } catch {
      setError("Failed to update member role");
    }
  };

  const handleRemoveMember = async (memberId: string, isSelf: boolean) => {
    if (
      !confirm(
        isSelf
          ? "Are you sure you want to leave this workspace?"
          : "Are you sure you want to remove this member?"
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "DELETE",
      });

      const data: ApiResponse<{ removed: boolean }> = await res.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      if (isSelf) {
        router.push("/workspaces");
        return;
      }

      setSuccess("Member removed from workspace");
      reloadMembers();
    } catch {
      setError("Failed to remove member");
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm("Revoke this invitation?")) return;

    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: "DELETE",
      });

      const data: ApiResponse<{ revoked: boolean }> = await res.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      setSuccess("Invitation revoked");
      reloadMembers();
    } catch {
      setError("Failed to revoke invitation");
    }
  };

  const copyInviteLink = async (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.OWNER:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="h-3 w-3" />
            Owner
          </span>
        );
      case Role.ADMIN:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="h-3 w-3" />
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-500/10 border border-slate-500/30 text-slate-400">
            <User className="h-3 w-3" />
            Member
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-400" />
            <span>Workspace Members &amp; Permissions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your team, invite collaborators, and adjust role-based privileges
          </p>
        </div>

        {canManageMembers && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/25 transition-all self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Active Members Section */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">Active Members ({members.length})</h2>
          <span className="text-xs text-slate-500">
            Your role: <span className="font-semibold text-slate-300">{currentMemberRole}</span>
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {members.map((m) => {
            const isSelf = m.userId === currentUser?.id;
            const isOwner = m.role === Role.OWNER;
            const isCallerOwner = currentMemberRole === Role.OWNER;
            const canChangeRole =
              canManageMembers && !isOwner && (isCallerOwner || m.role === Role.MEMBER);
            const canRemove =
              (canManageMembers && !isOwner && (isCallerOwner || m.role === Role.MEMBER)) || isSelf;

            return (
              <div
                key={m.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center shrink-0">
                    <div className="h-full w-full bg-slate-950 rounded-full flex items-center justify-center font-bold text-xs text-indigo-300">
                      {m.user.name ? m.user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100 truncate">
                        {m.user.name || "Anonymous Member"}
                      </span>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                      <span>{m.user.email}</span>
                      <span>•</span>
                      <span>Joined {formatDate(m.joinedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  {canChangeRole ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as Role)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 cursor-pointer"
                    >
                      <option value={Role.MEMBER}>Member</option>
                      <option value={Role.ADMIN}>Admin</option>
                    </select>
                  ) : (
                    getRoleBadge(m.role)
                  )}

                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(m.id, isSelf)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title={isSelf ? "Leave Workspace" : "Remove Member"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations Section (Admins/Owners Only) */}
      {canManageMembers && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan-400" />
              <span>Pending Invitations ({invitations.length})</span>
            </h2>
          </div>

          {invitations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No pending invitations. Use the button above to invite colleagues.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-200">{inv.email}</span>
                      {getRoleBadge(inv.role)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>Expires {formatDate(inv.expiresAt)}</span>
                      <span>•</span>
                      <span>Invited by {inv.inviter.name || inv.inviter.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => copyInviteLink(inv.token)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedToken === inv.token ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleRevokeInvitation(inv.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Revoke Invitation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <InviteMemberModal
        workspaceId={workspaceId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          reloadMembers();
        }}
      />
    </main>
  );
}
