import { useEffect, useState } from "react";
import {
  useLoaderData,
  Form,
  useSubmit,
  useActionData,
} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { getUserFromSession } from "~/utils/session.server";
import { Plus } from "lucide-react";
import PasswordModal from "~/components/Modal";
import bcrypt from "bcryptjs";

// Loader to fetch cashiers
export const loader = async ({ request }: { request: Request }) => {
  const user = await getUserFromSession(request);
  if (!user || user.role !== "storeManager")
    throw new Response("Unauthorized", { status: 401 });

  const cashiers = await prisma.user.findMany({
    where: { storeId: user.storeId, role: "cashier" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      active: true,
    },
  });

  return json({ cashiers, user });
};

// Action to handle verification, deletion, and reactivation
export const action = async ({ request }: { request: Request }) => {
  const user = await getUserFromSession(request);
  if (!user || user.role !== "storeManager")
    throw new Response("Unauthorized", { status: 401 });

  const formData = await request.formData();
  const password = formData.get("password") as string;
  const actionType = formData.get("actionType") as string;
  const cashierId = formData.get("cashierId") as string;

  const manager = await prisma.user.findFirst({ where: { id: user.id } });
  if (!manager) return json({ success: false, error: "User not found" });

  if (!password)
    return json({ error: "Password is required" }, { status: 400 });

  const isValidPassword = await bcrypt.compare(password, manager.password);
  if (!isValidPassword)
    return json({ error: "Invalid password" }, { status: 400 });

  if (actionType === "delete") {
    await prisma.user.update({
      where: { id: cashierId },
      data: { active: false },
    });

    return json({ success: true });
  }

  if (actionType === "reactivate") {
    await prisma.user.update({
      where: { id: cashierId },
      data: { active: true },
    });

    return json({ success: true });
  }

  if (actionType === "add") {
    return redirect(`/auth/signup?store=${user.storeId}`);
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function ManageCashiers() {
  const { cashiers, user } = useLoaderData<{ cashiers: any[]; user: any }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<
    "add" | "delete" | "reactivate">();
  const [selectedCashier, setSelectedCashier] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const actionData = useActionData<{ success?: boolean; error?: string }>();
  const submit = useSubmit();

  const openModal = (
    action: "add" | "delete" | "reactivate",
    cashierId?: string
  ) => {
    setModalOpen(true);
    setModalAction(action);
    setSelectedCashier(cashierId || null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.append("actionType", modalAction || "");
    if (selectedCashier) formData.append("cashierId", selectedCashier);
    submit(formData, { method: "post" });
  };

  useEffect(() => {
    if (actionData?.success) {
      setModalOpen(false);
    }
  }, [actionData]);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🧑‍💼 Manage Cashiers</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            {showInactive ? "Hide Inactive Cashiers" : "Show Inactive Cashiers"}
          </button>
          <button
            onClick={() => openModal("add")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center"
          >
            <Plus className="w-5 h-5 mr-1" />
            Add Cashier
          </button>
        </div>
      </div>

      {cashiers.length === 0 ? (
        <div className="text-center text-gray-600 py-10">
          <p className="text-lg font-semibold">No cashiers found!</p>
          <p className="text-sm text-gray-500">
            Click "Add Cashier" to add a new cashier.
          </p>
        </div>
      ) : (
        <table className="w-full border-collapse border bg-gray-50 shadow-md">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3 border">👤 Name</th>
              <th className="p-3 border">📧 Email</th>
              <th className="p-3 border">🕒 Created At</th>
              <th className="p-3 border">⚙️ Actions</th>
            </tr>
          </thead>
          <tbody>
            {cashiers
              .filter((cashier) =>
                showInactive ? !cashier.active : cashier.active
              )
              .map((cashier) => (
                <tr
                  key={cashier.id}
                  className="text-center border bg-white hover:bg-gray-100"
                >
                  <td className="p-3 border">{cashier.name}</td>
                  <td className="p-3 border">{cashier.email}</td>
                  <td className="p-3 border">
                    {new Date(cashier.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 border">
                    {cashier.active ? (
                      <button
                        onClick={() => openModal("delete", cashier.id)}
                        className="px-3 py-1 rounded text-white bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1 rounded text-white bg-blue-500 hover:bg-blue-600"
                        onClick={() => openModal("reactivate", cashier.id)}
                      >
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {/* Password Modal */}
      {modalOpen && (
        <PasswordModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedCashier(null);
            actionData === null;
          }}
          userId={user.id}
          actionData={actionData || null}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
