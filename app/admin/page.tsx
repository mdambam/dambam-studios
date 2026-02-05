"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import { ProtectedRoute } from "@/components/protected-route";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type AdminUserRow = {
  id: string
  name: string
  email: string
  credits: number
  imageCount: number
  createdAt: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setError(null)
      const res = await fetch("/api/admin/users", { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load users')
      }
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load users'
      setError(msg)
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      return (
        u.email.toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q)
      )
    })
  }, [users, search])

  return (
    <ProtectedRoute adminOnly>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-foreground/60">Manage users and monitor usage</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => router.push('/admin/users')}>Manage Users</Button>
                <Button variant="outline" onClick={() => router.push('/admin/styles')}>Manage Styles</Button>
                <Button onClick={() => router.push('/admin/styles/new')}>Create Style</Button>
                <CSVLink
                  data={filteredUsers}
                  filename={`users-${new Date().toISOString().slice(0, 10)}.csv`}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition"
                >
                  Export CSV
                </CSVLink>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <div className="flex items-center justify-between gap-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="w-full max-w-md px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                  disabled={loading}
                >
                  {loading ? 'Loading…' : 'Refresh'}
                </button>
              </div>
              {error && (
                <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-foreground/70">
                    <tr>
                      <th className="text-left font-medium px-6 py-4">Name</th>
                      <th className="text-left font-medium px-6 py-4">Email</th>
                      <th className="text-right font-medium px-6 py-4">Credits</th>
                      <th className="text-right font-medium px-6 py-4">Images</th>
                      <th className="text-left font-medium px-6 py-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-foreground/60">
                          Loading users…
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-foreground/60">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="border-t border-border">
                          <td className="px-6 py-4 font-medium">{u.name}</td>
                          <td className="px-6 py-4 text-foreground/70">{u.email}</td>
                          <td className="px-6 py-4 text-right">{u.credits}</td>
                          <td className="px-6 py-4 text-right">{u.imageCount}</td>
                          <td className="px-6 py-4 text-foreground/70">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}