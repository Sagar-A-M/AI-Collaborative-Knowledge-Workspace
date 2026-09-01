"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Building2,
  Sparkles,
  Shield,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  LogIn,
} from "lucide-react";
import type { ApiResponse } from "@/types/api";
import { Role } from "@prisma/client";

interface InvitationData {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: string;
  isExpired: boolean;
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  inviter: {
    name: string | null;
    email: string;
  };
}

export default function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInvitation() {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data: ApiResponse<{ invitation: InvitationData }> = await res.json();

        if (isMounted) {
          if (data.success) {
            setInvitation(data.data.invitation);
          } else {
            setError(data.error.message);
          }
        }
      } catch {
        if (isMounted) {
          setError("Failed to load invitation details");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInvitation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAccept = async () => {
    setError(null);
    setIsAccepting(true);

    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
      });

      const data: ApiResponse<{ workspaceId: string; workspaceSlug: string }> = await res.json();

      if (!data.success) {
        setError(data.error.message);
        setIsAccepting(false);
        return;
      }

      router.push(`/workspaces/${data.data.workspaceId}`);
    } catch {
      setError("Failed to accept invitation. Please try again.");
      setIsAccepting(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Invalid or Expired Invitation</h1>
          <p className="text-xs text-slate-400">
            {error || "This invitation link is invalid, has expired, or has already been used."}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 mx-auto shadow-lg shadow-indigo-500/25 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Building2 className="h-7 w-7 text-indigo-400" />
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Workspace Invitation</span>
          </span>
          <h1 className="text-2xl font-bold text-slate-100">Join {invitation.workspace.name}</h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            <span className="text-slate-200 font-semibold">
              {invitation.inviter.name || invitation.inviter.email}
            </span>{" "}
            has invited you to collaborate in this workspace.
          </p>
        </div>

        {/* Workspace Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Workspace</span>
            <span className="font-semibold text-slate-200 font-mono">
              app/{invitation.workspace.slug}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Invited Role</span>
            <span className="inline-flex items-center gap-1 font-semibold text-cyan-400">
              {invitation.role === Role.ADMIN ? (
                <>
                  <Shield className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5" />
                  <span>Member</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Target Email</span>
            <span className="text-slate-300 font-mono">{invitation.email}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {user ? (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Joining Workspace...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Accept Invitation &amp; Join</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-500">
              Logged in as <span className="text-slate-300 font-medium">{user.email}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Link
              href={`/login?callbackUrl=/invite/${token}`}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In to Accept</span>
            </Link>

            <Link
              href={`/register`}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Create an Account First</span>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
