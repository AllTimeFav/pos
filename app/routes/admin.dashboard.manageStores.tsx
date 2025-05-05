import { Form, useLoaderData, Link, useNavigate, useActionData } from "@remix-run/react";
import { ActionFunction, json, redirect } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { FormatTitle } from "~/components/FormatTitle";
import { useEffect, useState } from "react";
import { getUserFromSession } from "~/utils/session.server";
import bcrypt from "bcryptjs";

// Loader to fetch available stores
export const loader = async ({ request }: { request: Request }) => {
  const stores = await prisma.store.findMany({
    select: { id: true, name: true },
  });
  const user = await getUserFromSession(request);

  return json({ stores, user });
};

// Handle store selection and password verification
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const adminId = formData.get("adminId") as string;
  const password = formData.get("password") as string;
  const storeId = formData.get("storeId") as string;

  if (!password || typeof adminId !== "string" || !storeId) {
    return json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const admin = await prisma.user.findFirst({ where: { id: adminId } });

  if (!admin) {
    return json({ success: false, error: "Incorrect password" }, { status: 401 });
  }

  const isValidPassword = await bcrypt.compare(password, admin.password);
  if (!isValidPassword) {
    return json({ success: false, error: "Invalid password" }, { status: 400 });
  }

  return json({ success: true, storeId });
};

export default function AdminHome() {
  const { stores, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ success?: boolean; error?: string; storeId?: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState("");

  // Navigate to signup page when password is verified
  useEffect(() => {
    if (actionData?.success) {
      navigate(`/auth/signup?store=${actionData.storeId}`);
      console.log("first")
    }
    console.log("ss")
  }, [actionData]);

  const openPasswordModal = (storeId: string) => {
    setSelectedStoreId(storeId);
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setPassword("");
    setSelectedStoreId("");
  };

  // Filter out "POS Admins" store
  const filteredStores = stores.filter((store : any) => store.name !== "POS Admins");
  const posAdminStore = stores.find((store : any) => store.name === "POS Admins");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome to the POS System</h1>

        {filteredStores.length > 0 ? (
          <>
            <p className="text-gray-600 text-center mb-4">Select your store to continue:</p>
            <select
              onChange={(e) => setSelectedStoreId(e.target.value)}
              value={selectedStoreId}
              required
              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>Select Store</option>
              {filteredStores.map((store : any) => (
                <option key={store.id} value={store.id}>
                  {<FormatTitle name={store.name} />}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedStoreId && openPasswordModal(selectedStoreId)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition mt-4"
              disabled={!selectedStoreId}
            >
              Continue
            </button>
          </>
        ) : (
          <p className="text-center text-gray-500">No stores available. Please contact the administrator.</p>
        )}

        {/* Password Modal */}
        {passwordModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <Form method="post" className="bg-white p-6 rounded-lg shadow-lg max-w-md">
              <h2 className="text-lg font-bold mb-4">Enter Admin Password</h2>
              <input type="hidden" name="adminId" value={user?.id} />
              <input type="hidden" name="storeId" value={selectedStoreId} />
              <input
                type="password"
                placeholder="Enter password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                required
              />
              {actionData?.error && (
                <p className="text-red-500 text-center mt-3">{actionData.error}</p>
              )}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
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
    </div>
  );
}
