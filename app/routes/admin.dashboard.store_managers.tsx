import { useLoaderData, useSubmit, Link, Form, useActionData, redirectDocument } from "@remix-run/react";
import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { FormatTitle } from "~/components/FormatTitle";
import { useState, useMemo, useEffect } from "react";
import { getUserFromSession } from "~/utils/session.server";
import bcrypt from "bcryptjs";

export const loader = async ({request} : { request: Request}) => {
  const admin = await getUserFromSession(request);
  const storeManagers = await prisma.user.findMany({
    where: { role: "storeManager" },
    include: { store: true },
  });

  return json({ storeManagers, admin });
};

export const action: ActionFunction = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const adminId = formData.get("adminId") as string;
  const password = formData.get("password") as string;

  if (!password || typeof adminId !== "string") {
    return json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const admin = await prisma.user.findFirst({ where: {  id: adminId } });

  if (!admin) {
    return json({ success: false, error: "Incorrect password" }, { status: 401 });
  }

 const isValidPassword = await bcrypt.compare(password, admin?.password);
  if (!isValidPassword)
    return json({ error: "Invalid password" }, { status: 400 });

  return json({ success: true });
};

interface Store {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string,
  store: Store | null;
}

export default function StoreManagers() {
  const { storeManagers, admin } = useLoaderData<{ storeManagers: User[], admin: User }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStore, setFilterStore] = useState("all");
 

  const uniqueStores = useMemo(
    () => Array.from(new Set(storeManagers.map((m) => m.store?.name ?? "No Store Assigned"))),
    [storeManagers]
  );

  const filteredManagers = useMemo(() => {
    return storeManagers.filter((manager) => {
      const matchesSearch =
        manager.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manager.store?.name?.toLowerCase().includes(searchQuery.toLowerCase());


      const matchesStore = filterStore === "all" || manager.store?.name === filterStore;

      return matchesSearch && matchesStore;
    });
  }, [storeManagers, searchQuery, filterStore]);

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Store Managers</h1>
      </div>

      {/* Search & Filter Section */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or store..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />

        <select
          value={filterStore}
          onChange={(e) => setFilterStore(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All Stores</option>
          {uniqueStores.map((store) => (
            <option key={store} value={store}>
              {<FormatTitle name={store} />}
            </option>
          ))}
        </select>
      </div>

      {filteredManagers.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
              <tr>
                <th className="py-3 px-4 text-left">Manager Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Store Name</th>
                <th className="py-3 px-4 text-left">Registered At</th>
              </tr>
            </thead>
            <tbody>
              {filteredManagers.map((manager) => (
                <tr key={manager.id} className="border-t hover:bg-gray-50 transition-all">
                  <td className="py-3 px-4">{<FormatTitle name={manager.name} />}</td>
                  <td className="py-3 px-4">{manager.email}</td>
                  <td className="py-3 px-4">{manager.store?.name ?? "No Store Assigned"}</td>
                  <td className="py-3 px-4">{new Date(manager.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 mt-2 text-center">No store managers found.</p>
      )}

    </div>
  );
}
