"use client";
import { useEffect, useState } from "react";
import { API_URL } from "../api/config";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/admin/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));

    fetch(`${API_URL}/admin/logs`)
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []));
  }, []);

  return (
    <div className="p-6 space-y-8">
      <section>
        <h1 className="text-xl font-bold mb-4">Registered Users</h1>
        <table className="border-collapse border border-gray-400 w-full">
          <thead>
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i}>
                <td className="border p-2">{u.id}</td>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">{u.name}</td>
                <td className="border p-2">{u.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h1 className="text-xl font-bold mb-4">Logs</h1>
        <table className="border-collapse border border-gray-400 w-full">
          <thead>
            <tr>
              <th className="border p-2">Timestamp</th>
              <th className="border p-2">Action</th>
              <th className="border p-2">User ID</th>
              <th className="border p-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i}>
                <td className="border p-2">{l.timestamp}</td>
                <td className="border p-2">{l.action}</td>
                <td className="border p-2">{l.userId}</td>
                <td className="border p-2">{l.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
