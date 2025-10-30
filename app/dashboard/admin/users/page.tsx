"use client";
import { useEffect, useState } from "react";
import { API_URL } from "../../../api/config";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch(`${API_URL}/admin/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));
  }, []);

  const totalPages = Math.ceil(users.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const pagedUsers = users.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">User Dashboard</h1>

      {/* User Table */}
      <div className="overflow-hidden rounded-xl shadow border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedUsers.map((u, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-800">{u.id}</td>
                <td className="px-4 py-2 text-sm text-gray-800">{u.email}</td>
                <td className="px-4 py-2 text-sm text-gray-800">{u.name}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{u.createdAt}</td>
              </tr>
            ))}
            {pagedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-6">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg border ${
              page === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-lg border ${
              page === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
