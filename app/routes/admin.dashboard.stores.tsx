import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { useEffect, useState } from "react";
import { FormatTitle } from "~/components/FormatTitle";

export const loader = async () => {
  const stores = await prisma.store.findMany({
    where: { name: { not: "pos admins" } },
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { role: "storeManager" },
        orderBy: { createdAt: "asc" },
        select: { name: true },
      },
    },
  });
  console.log("Stores", stores);
  return json({ stores });
};

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const storeId = formData.get("storeId") as string;

  if (actionType === "delete") {
    await prisma.store.delete({ where: { id: storeId } });
    return redirect("/admin/dashboard/stores");
  }

  if (actionType === "edit") {
    const newName = formData.get("newName") as string;
    const name = newName.toLowerCase();
    if (!name.trim()) {
      return json({ error: "Store name cannot be empty." }, { status: 400 });
    }

    const existingStore = await prisma.store.findFirst({
      where: {
        name: name,
        NOT: { id: storeId },
      },
    });

    if (existingStore) {
      return json(
        { error: "Store name already exists. Choose a different name." },
        { status: 400 }
      );
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { name: name },
    });

    return json({ success: true });
  }

  return json({ error: "Invalid action." }, { status: 400 });
};

export default function StoresInfo() {
  const { stores } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ success: boolean; error: string }>();
  const [editMode, setEditMode] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");

  useEffect(() => {
    if (fetcher.data?.success) {
      setEditMode(null);
    }
  }, [fetcher.data]);

  return (
    <div className="container mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Stores Information</h1>
        <Link
          to="/admin/dashboard/create_store"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
        >
          + Add Store
        </Link>
      </div>

      {fetcher.data?.error && (
        <p className="text-red-500 mb-2">{fetcher.data.error}</p>
      )}

      {stores.length > 0 ? (
        <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-3 text-center">Store Name</th>
              <th className="border p-3 text-center">Assigned Manager</th>
              <th className="border p-3 text-center">Registered At</th>
              <th className="border p-3 text-center">Edit</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr
                key={store.id}
                className="hover:bg-gray-50 transition duration-200"
              >
                <td className="border p-3 text-center">
                  {editMode === store.id ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="border border-black rounded p-2"
                    />
                  ) : (
                    <FormatTitle name={store.name} />
                  )}
                </td>
                <td className="border p-3 text-center">
                  {store.users.length > 0
                    ? <FormatTitle name={store.users[0].name} />
                    : "Not Assigned"}
                </td>
                <td className="border p-3 text-center">
                  {new Date(store.createdAt).toLocaleDateString()}
                </td>
                <td className="border p-3 flex justify-center gap-2">
                  {editMode === store.id ? (
                    <fetcher.Form method="post" className="flex gap-2">
                      <input type="hidden" name="storeId" value={store.id} />
                      <input type="hidden" name="actionType" value="edit" />
                      <input type="hidden" name="newName" value={newName} />
                      <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded transition duration-200"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded transition duration-200"
                        onClick={() => setEditMode(null)}
                      >
                        Cancel
                      </button>
                    </fetcher.Form>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded transition duration-200"
                        onClick={() => {
                          setEditMode(store.id);
                          setNewName(store.name);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 mt-4">No stores available.</p>
      )}
    </div>
  );
}
