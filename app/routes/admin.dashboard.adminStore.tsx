import {
  useLoaderData,
  Link,
  Form,
  useActionData,
  redirect,
  useNavigate,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { FormatTitle } from "~/components/FormatTitle";
import { useEffect, useState } from "react";
import { getUserFromSession } from "~/utils/session.server";
import { ActionFunction } from "@remix-run/node";
import bcrypt from "bcryptjs";

export const loader = async ({ request }: { request: Request }) => {
  const admin = await getUserFromSession(request);
  const adminStore = await prisma.store.findFirst({
    where: { name: "pos admins" },
    include: { users: true },
  });

  if (!adminStore) {
    return json({ error: "POS Admins store not found." }, { status: 404 });
  }

  return json({ adminStore, admin });
};

interface User {
  id: string;
  role: string;
  storeId: string;
  name: string;
  createdAt: Date;
  email: string;
  password: string;
}

interface AdminStore {
  id: string;
  name: string;
  users: User[];
}

export const action: ActionFunction = async ({
  request,
}: {
  request: Request;
}) => {
  const formData = await request.formData();
  const adminId = formData.get("adminId") as string;
  const password = formData.get("password") as string;

  if (!password || typeof adminId !== "string") {
    return json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const admin = await prisma.user.findFirst({ where: { id: adminId } });

  if (!admin) {
    return json(
      { success: false, error: "Incorrect password" },
      { status: 401 }
    );
  }

  const isValidPassword = await bcrypt.compare(password, admin?.password);
  if (!isValidPassword)
    return json({ error: "Invalid password" }, { status: 400 });

  return json({ success: true });
};

export default function AdminStore() {
  const { adminStore, admin } = useLoaderData<{
    adminStore: AdminStore;
    admin: any;
  }>();
  const actionData = useActionData<{ success?: boolean; error?: string }>();

  const [password, setPassword] = useState("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const openPasswordModal = () => {
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setPassword("");
  };

  if (!adminStore) {
    return (
      <p className="text-red-500 text-center text-lg">
        POS Admins store not found.
      </p>
    );
  }

  useEffect(() => {
    if (actionData?.success) {
      navigate(`/auth/signup?store=${adminStore.id}`);
    }
  }, [actionData]);

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">{adminStore.name}</h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => openPasswordModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
        >
          ➕ Add Admin
        </button>
      </div>

      {adminStore.users.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
              <tr>
                <th className="py-3 px-4 text-left">User Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {adminStore.users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t hover:bg-gray-50 transition-all"
                >
                  <td className="py-3 px-4">
                    {<FormatTitle name={user.name} />}
                  </td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 mt-2 text-center">
          No users found in this store.
        </p>
      )}

      {/* Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <Form
            method="post"
            className="bg-white p-6 rounded-lg shadow-lg max-w-md"
          >
            <h2 className="text-lg font-bold mb-4">Enter Admin Password</h2>
            <input type="hidden" name="adminId" value={admin.id} />
            <input
              type="password"
              placeholder="Enter password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
            {actionData?.error && (
              <p className="text-red-500 text-center mt-3">
                {actionData.error}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={closePasswordModal}
                className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}
