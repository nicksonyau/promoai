"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/app/api/config";
import toast from "react-hot-toast";
import useTranslations from "@/app/hooks/useTranslations";

export default function AdminUsersPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const { t } = useTranslations(lang);

  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch(`${API_URL}/admin/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => toast.error(t("errors.SERVER_ERROR")));
  }, []);

  const totalPages = Math.ceil(users.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const pagedUsers = users.slice(startIndex, startIndex + pageSize);

  const handleDelete = async (email: string) => {
    if (!confirm(t("admin_users.confirm_delete") + " " + email + "?")) return;

    const res = await fetch(`${API_URL}/admin/delete-user?email=${email}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error(t("admin_users.delete_failed"));
      return;
    }

    toast.success(t("admin_users.deleted_success"));
    setUsers((prev) => prev.filter((u) => u.email !== email));
  };

  return (
    <div>
      <h1 className="page-title">{t("admin_users.title")}</h1>

      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>{t("admin_users.id")}</th>
              <th>{t("admin_users.email")}</th>
              <th>{t("admin_users.name")}</th>
              <th>{t("admin_users.role")}</th>
              <th>{t("admin_users.status")}</th>
              <th>{t("admin_users.created_at")}</th>
              <th>{t("admin_users.actions")}</th>
            </tr>
          </thead>

          <tbody>
            {pagedUsers.map((u, i) => (
              <tr key={i}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.name}</td>

                {/* ROLE */}
                <td>
                  <span
                    className={
                      u.role === "admin"
                        ? "badge badge-blue"
                        : "badge badge-gray"
                    }
                  >
                    {u.role || "user"}
                  </span>
                </td>

                {/* STATUS */}
                <td>
                  <span
                    className={
                      u.status === "active"
                        ? "badge badge-green"
                        : "badge badge-yellow"
                    }
                  >
                    {u.status || "unknown"}
                  </span>
                </td>

                <td>{u.createdAt}</td>

                <td>
                  <button
                    onClick={() => handleDelete(u.email)}
                    className="btn-danger"
                  >
                    {t("admin_users.delete")}
                  </button>
                </td>
              </tr>
            ))}

            {pagedUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-6">
                  {t("admin_users.no_users")}
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
            className="btn-secondary w-auto"
          >
            {t("admin_users.prev")}
          </button>

          <span className="text-sm text-gray-600">
            {t("admin_users.page")} {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="btn-secondary w-auto"
          >
            {t("admin_users.next")}
          </button>
        </div>
      )}
    </div>
  );
}
