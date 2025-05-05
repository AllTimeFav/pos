import { useState } from "react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { FormatTitle } from "~/components/FormatTitle";

export const loader = async () => {
  const products = await prisma.product.findMany({
    include: { store: true },
  });

  const stores = await prisma.store.findMany({
    select: { id: true, name: true },
  });

  return json({ products, stores });
};

export default function AdminProducts() {
  const { products, stores } = useLoaderData<typeof loader>();
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("");

  const filteredStores = stores.filter((store) => store.name !== "pos admins");
  // Filter products based on search input and store selection
  const filteredProducts = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedStore === "" || product.store.id === selectedStore)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Product Management</h1>

      {/* Filters Section */}
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg w-full md:w-1/2"
        />

        {/* Store Filter Dropdown */}
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="border p-2 rounded-lg w-full md:w-1/2"
        >
          <option value="">All Stores</option>
          {filteredStores.map((store) => (
            <option key={store.id} value={store.id}>
              {<FormatTitle name={store.name} />}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Stock</th>
              <th className="border p-2">Store</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id} className="text-center">
                  <td className="border p-2">{product.name}</td>
                  <td className="border p-2">${product.price.toFixed(2)}</td>
                  <td className="border p-2">{product.stock}</td>
                  <td className="border p-2">{<FormatTitle  name={product.store.name} />}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="border p-2 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
