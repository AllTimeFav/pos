import { useEffect, useState } from "react";
import { json, useActionData, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";
import { getUserFromSession } from "~/utils/session.server";
import bcrypt from "bcryptjs";
import { ActionFunction } from "@remix-run/node";
import PasswordModal from "~/components/Modal";

// Loader function
export const loader = async ({ request } : { request: Request }) => {
  const user = await getUserFromSession(request);
  if (!user || user.role !== "storeManager") throw new Response("Unauthorized", { status: 401 });

  const managers = await prisma.user.findMany({
    where: { storeId: user.storeId, role: "storeManager" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return { managers, user };
};

export const action: ActionFunction = async ({
  request,
}: {
  request: Request;
}) => {
  const formData = await request.formData();
  const userId = formData.get("userId") as string;
  const password = formData.get("password") as string;

  if (!password || typeof userId !== "string") {
    return json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const admin = await prisma.user.findFirst({ where: { id: userId } });

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

export default function ManageManagers() {
  const { managers, user } = useLoaderData<typeof loader>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData<{ success?: boolean; error?: string }>();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    submit(formData, { method: "post" });
  };

  useEffect(() => {
    if (actionData?.success) {
      setIsModalOpen(false);
      navigate(`/auth/signup?store=${user.storeId}`);
    }
  }, [actionData]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      {/* Header with "Add Manager" Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏢 Manage Store Managers</h1>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          ➕ Add Manager
        </button>
      </div>

      {/* Managers Table */}
      {managers.length > 0 ? (
        <table className="w-full border-collapse border bg-gray-50">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3 border">👤 Name</th>
              <th className="p-3 border">📧 Email</th>
              <th className="p-3 border">🕒 Registered At</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((manager : any) => (
              <tr key={manager.id} className="text-center border">
                <td className="p-3 border">{manager.name}</td>
                <td className="p-3 border">{manager.email}</td>
                <td className="p-3 border">{new Date(manager.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500">No store managers found.</p>
      )}

      <PasswordModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        userId={user.id}
        actionData={actionData || null}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}