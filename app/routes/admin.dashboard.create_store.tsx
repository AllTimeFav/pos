import { Form, useActionData } from "@remix-run/react";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { Prisma } from "@prisma/client";
import { redirect } from "react-router-dom";

// Handle store creation request
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const storeName = formData.get("storeName") as string;

  if (!storeName) {
    return json({ error: "Store name is required" }, { status: 400 });
  }

  try {
    // Check if store already exists
    const existingStore = await prisma.store.findUnique({
      where: { name: storeName },
    });

    if (existingStore) {
      return json({ error: "Store name already exists" }, { status: 400 });
    }

    const store = await prisma.store.create({
      data: { name: storeName } as Prisma.StoreCreateInput,
    });
    
    return redirect("/admin/dashboard/stores");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle unique constraint error (code P2002)
      if (error.code === "P2002") {
        return json({ error: "Store name already exists" }, { status: 400 });
      }
    }
    return json({ error: "Something went wrong" }, { status: 500 });
  }
};

interface Store {
  id : string,
  name : string
}

export default function CreateStorePage() {
  const actionData = useActionData<{ message: string; store?: Store; error: string }>();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">Create a New Store</h2>

        <Form method="post" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Store Name:</label>
            <input
              type="text"
              name="storeName"
              required
              className="w-full mt-1 p-2 border rounded-lg focus:ring focus:ring-blue-300"
              placeholder="Enter store name"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Create Store
          </button>
        </Form>

        {actionData?.error && (
          <p className="mt-3 text-center text-red-500 font-medium">{actionData.error}</p>
        )}

        {actionData?.store && (
          <p className="mt-3 text-center text-green-600 font-medium">
            Store <strong>{actionData.store.name}</strong> was created successfully!
          </p>
        )}
      </div>
    </div>
  );
}

