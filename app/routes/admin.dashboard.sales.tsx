import { useState } from "react";
import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { FormatTitle } from "~/components/FormatTitle";

export const loader: LoaderFunction = async () => {
  const sales = await prisma.sales.findMany({
    include: { store: true,  user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const stores = await prisma.store.findMany({
    where: { name: { not: "pos admins" } },
    select: { id: true, name: true },
  });

  return json({ sales, stores });
};

interface Receipt {
  id: string;
  userId: string;
  user: { name: string };
  store: Store;
  total: number;
  items: CartItem[];
  createdAt: string;
}

interface Store {
  id: string;
  name: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
}

export default function AdminSales() {
  const { sales, stores } = useLoaderData<{ sales: Receipt[]; stores: Store[] }>();
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.createdAt).toLocaleDateString("en-CA"); 
    return (
      (selectedStore === "" || sale.store.id === selectedStore) &&
      (selectedDate === "" || saleDate === selectedDate)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sales Reports</h1>

      {/* Filters Section */}
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        {/* Store Filter */}
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="border p-2 rounded-lg w-full md:w-1/3"
        >
          <option value="">All Stores</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {<FormatTitle name={store.name} />}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded-lg w-full md:w-1/3"
        />
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto">
  <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
    <thead>
      <tr className="bg-gray-200">
        <th className="border p-2">Date</th>
        <th className="border p-2">Total Amount</th>
        <th className="border p-2">Store</th>
        <th className="border p-2">Sold Items</th>
        <th className="border p-2">Sold By</th> {/* New Column */}
      </tr>
    </thead>
    <tbody>
      {filteredSales.length > 0 ? (
        filteredSales.map((sale) => (
          <tr key={sale.id} className="text-center">
            <td className="border p-2">
              {new Date(sale.createdAt).toLocaleDateString("en-CA")} {/* Show YYYY-MM-DD */}
            </td>
            <td className="border p-2">{sale.total.toFixed(2)} Rs</td>
            <td className="border p-2">{<FormatTitle name={sale.store.name} />}</td>
            <td className="border p-2">
              <ul className="list-disc text-left pl-8">
                {sale.items.map((item) => (
                  <li key={item.id}>
                    {item.name} x {item.quantity}
                  </li>
                ))}
              </ul>
            </td>
            <td className="border p-2">{sale.user?.name? <FormatTitle name={sale.user?.name} />  : "Unknown"}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={5} className="border p-2 text-center text-gray-500">
            No sales found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

    </div>
  );
}
