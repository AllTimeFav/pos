import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { Search, ArrowDownUp, Calendar } from "~/components/Icons";
import { LoaderFunction } from "@remix-run/node";
import { getUserFromSession } from "~/utils/session.server";
import { prisma } from "~/utils/prisma.server";
import { FormatTitle } from "~/components/FormatTitle";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserFromSession(request);
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const sales = await prisma.sales.findMany({
    where: { storeId: user.storeId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return { sales };
};

export default function SalesHistory() {
  const { sales } = useLoaderData<{ sales: any[] }>();
  const [sortBy, setSortBy] = useState<"date" | "cashier" | "amount">("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const sortedSales = [...sales].sort((a, b) => {
    if (sortBy === "cashier") return a.user.name.localeCompare(b.user.name);
    if (sortBy === "amount") return b.total - a.total;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredSales = sortedSales.filter((sale) => {
    const cashierMatch = sale.user?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const productMatch = sale.items.some((item: any) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const saleDate = new Date(sale.createdAt).toISOString().split("T")[0]; // Extract YYYY-MM-DD
    const dateMatch = searchDate ? saleDate === searchDate : true;

    return (cashierMatch || productMatch) && dateMatch;
  });

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Sales Report</h1>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        {/* Search Input */}
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by Cashier or Product..."
            className="w-full pl-10 p-2 border rounded-lg bg-gray-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Picker */}
        <div className="relative w-full sm:w-1/3">
          <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
          <input
            type="date"
            className="w-full pl-10 p-2 border rounded-lg bg-gray-100"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center">
          <ArrowDownUp className="w-5 h-5 mr-2 text-gray-600" />
          <select
            className="border p-2 rounded-lg bg-gray-100"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "cashier" | "amount")}
          >
            <option value="date">📆 Date (Newest First)</option>
            <option value="cashier">👤 Cashier Name (A-Z)</option>
            <option value="amount">💰 Amount (Highest First)</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      {filteredSales.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border bg-gray-50">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 border">👤 Cashier</th>
                <th className="p-3 border">📆 Date</th>
                <th className="p-3 border">💰 Total (Rs)</th>
                <th className="p-3 border">🛒 Items</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="text-gray-800 text-center hover:bg-gray-100">
                  <td className="p-3 border">{<FormatTitle name={sale.user.name} />}</td>
                  <td className="p-3 border">{new Date(sale.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 border font-semibold">{sale.total.toFixed(2)} Rs</td>
                  <td className="p-3 border text-left">
                    <ul className="p-2">
                      {sale.items.map((item: any) => (
                        <li key={item.id} className="border-b py-1 flex justify-between">
                          <span>{item.name} × {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-4">No matching sales found.</p>
      )}
    </div>
  );
}
