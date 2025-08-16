import { LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";
import { useState } from "react";
import { ActionFunction } from "@remix-run/node";
import { getUserFromSession } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserFromSession(request);
  if(!user) {
    return null;
  }
  const storeId = user.storeId;
  const products = await prisma.product.findMany({ where : { storeId } });
  return { products };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const storeId = formData.get("storeId") as string;
  const productId = formData.get("productId") as string;

  if (!productId || !storeId) {
    throw new Response("Invalid product or store", { status: 400 });
  }
  await prisma.product.delete({ where: { id: productId, storeId } });

  return null;
};

export default function Products() {
  const { products } = useLoaderData<typeof loader>();
  const [showLowStock, setShowLowStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter Products
  const filteredProducts = products
    .filter((p: any) => !showLowStock || p.stock < 10)
    .filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Product Management</h1>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => setShowLowStock((prev) => !prev)}
            className={`px-4 py-2 rounded-md font-medium transition ${
              showLowStock ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-300 text-gray-900 hover:bg-gray-400"
            }`}
          >
            {showLowStock ? "Show All Products" : "Show Low Stock"}
          </button>

          <Link
            to="/products/add"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
          >
            + Add Product
          </Link>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-md shadow-sm">
        {filteredProducts.length > 0 ? (
          <table className="w-full border border-gray-300 bg-white shadow-md rounded-md">
            <thead>
              <tr className="bg-gray-200 text-gray-800 uppercase text-sm">
                <th className="p-3 text-center border">Product Name</th>
                <th className="p-3 text-center border">Price</th>
                <th className="p-3 text-center border">In Stocks</th>
                <th className="p-3 text-center border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product: any) => (
                <tr key={product.id} className="border hover:bg-gray-50">
                  <td className="p-3 border">{product.name}</td>
                  <td className="p-3 border text-green-600 font-semibold text-center">
                    {product.price.toFixed(2)} Rs
                  </td>
                  <td className={`p-3 border text-center ${product.stock < 10 ? "text-red-600 font-bold" : ""}`}>
                    {product.stock}
                  </td>
                  <td className="p-3 border text-center">
                    <div className="flex justify-center gap-2">
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition"
                      >
                        Edit
                      </Link>
                      <Form method="post">
                        <input type="hidden" name="storeId" value={product.storeId} />
                        <input type="hidden" name="productId" value={product.id} />
                        <button
                          type="submit"
                          className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 mt-4 text-center">No products found.</p>
        )}
      </div>
    </div>
  );
}
