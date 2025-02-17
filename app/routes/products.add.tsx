import { ActionFunction, redirect } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { json } from "react-router-dom";
import { prisma } from "~/utils/prisma.server";
import { getUserFromSession } from "~/utils/session.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string);
  const description = formData.get("description") as string;

  const user = await getUserFromSession(request);
  if (!user) {
    return redirect("/");
  }

  if (!name || !price || !stock || !description) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  const storeId = user.storeId;
  if (!storeId) {
    return json({ error: "Store not found" }, { status: 400 });
  }

  await prisma.product.create({ data: { storeId, name, price, stock, description } });

  return redirect("/store/dashboard/products");
};



export default function NewProduct() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Add New Product</h1>
        <Form method="post" className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Product Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter product name"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Price (PKR)</label>
            <input
              type="number"
              name="price"
              placeholder="Enter product price"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Stock</label>
            <input
              type="number"
              name="stock"
              placeholder="Enter available stock"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Description</label>
            <input
              type="text"
              name="description"
              placeholder="Enter product description"
              defaultValue="No Description"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between mt-4">
            <Link to={"/store/dashboard/products"} className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Save Product
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
