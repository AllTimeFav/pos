import {
  Link,
  Outlet,
  useNavigate,
  useLocation,
  useLoaderData,
} from "@remix-run/react";
import { useState } from "react";
import {
  LogOut,
  Menu,
  X,
  Store,
  Package,
  BarChart,
  Users,
  Briefcase,
  Shield,
  HomeIcon,
  
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { LoaderFunction, json } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { getUserFromSession } from "~/utils/session.server";
import { FormatTitle } from "~/components/FormatTitle";
import { redirect } from "react-router-dom";
import { CgPassword } from "react-icons/cg";

Chart.register(...registerables);

type Sale = {
  total: number;
  createdAt: string;
};

type SalesByStore = {
  storeName: string;
  storeSales: Sale[];
};

// **Loader Function to Fetch Data**
export const loader: LoaderFunction = async ({ request }) => {
  try {
    const user = await getUserFromSession(request);

    if (user?.role !== "admin") {
      if (user?.role === "storeManager") {
        return redirect("/store/dashboard");
      }
      if (user?.role === "cashier") {
        return redirect("/store/cart");
      }
    }

    const sales = await prisma.sales.findMany({
      include: { store: true },
      orderBy: { createdAt: "desc" },
    });

    const stores = await prisma.store.findMany({
      where: { name: { not: "pos admins" } },
    });

    const users = await prisma.user.findMany({
      where: { role: "storeManager" },
    });

    return json({ sales, stores, users, user });
  } catch (error) {
    return json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
};

export default function AdminDashboard() {
  const { sales, stores, users, user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();

  // **State for Sidebar Toggle**
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // **Filtering Active Stores and Users**
  const activeStores = stores.filter((store: any) => store.active);
  const activeUsers = users.filter((user: any) => user.active);

  // **Sales Data by Store**
  const salesByStore = activeStores.map((store: any) => ({
    storeName: store.name,
    storeSales: sales.filter((sale: any) => sale.storeId === store.id),
  }));
  // **Navigation Links**
  const navLinks = [
    { path: "/admin/dashboard", label: "Home", icon: <HomeIcon size={20} /> },
    {
      path: "/admin/dashboard/manageStores",
      label: "Add Managers & Cashiers",
      icon: <Briefcase size={20} />,
    },
    {
      path: "/admin/dashboard/products",
      label: "Product Management",
      icon: <Package size={20} />,
    },
    {
      path: "/admin/dashboard/sales",
      label: "Sales Reports",
      icon: <BarChart size={20} />,
    },
    {
      path: "/admin/dashboard/stores",
      label: "Stores Info",
      icon: <Store size={20} />,
    },
    {
      path: "/admin/dashboard/store_managers",
      label: "Store Managers",
      icon: <Users size={20} />,
    },
    {
      path: "/admin/dashboard/adminStore",
      label: "Admins",
      icon: <Shield size={20} />,
    },
    {
      path: "/admin/dashboard/resetRequests",
      label: "Password Reset Requests",
      icon: <CgPassword size={20} />,
    },
  ];

  // **Total Sales Calculation Fix**
  const totalSales = sales.reduce(
    (acc: number, sale: any) => acc + (sale.total || 0),
    0
  );
  const salesByStoreDate: Record<string, Record<string, number>> = salesByStore.reduce(
    (acc : any, store: SalesByStore) => {
      const { storeName, storeSales } = store; // Explicitly typed `store`

      if (!acc[storeName]) {
        acc[storeName] = {};
      }

      storeSales.forEach((sale) => {
        const date = new Date(sale.createdAt).toLocaleDateString();
        acc[storeName][date] = (acc[storeName][date] || 0) + sale.total;
      });

      return acc;
    },
    {} as Record<string, Record<string, number>>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`fixed left-0 top-0 h-screen ${
          isSidebarOpen ? "w-64" : "w-16"
        } bg-gray-900 text-white flex flex-col transition-all duration-300`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <h2
            className={`text-lg font-bold ${
              isSidebarOpen ? "block" : "hidden"
            }`}
          >
            Admin Panel
          </h2>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-300 hover:text-white"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 mt-4">
          <ul className="space-y-2">
            {navLinks.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 transition-all ${
                    location.pathname === item.path
                      ? "bg-gray-800 text-white font-semibold"
                      : "hover:bg-gray-800"
                  }`}
                >
                  {item.icon}
                  <span className={`${isSidebarOpen ? "block" : "hidden"}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-700 mt-auto">
          <button
            onClick={() => navigate("/auth/logout")}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-red-600 hover:bg-gray-800 transition-all"
          >
            <LogOut size={20} />
            <span className={`${isSidebarOpen ? "block" : "hidden"}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 p-6 rounded-lg transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-16"
        } bg-gray-100`}>
        {location.pathname === "/admin/dashboard" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-700">
                Dashboard
              </h1>
              <p className="text-gray-500">
                Welcome, <strong>{<FormatTitle name={user.name} />}</strong>!
                Here’s what’s happening today:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700">
                  Total Sales
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  PKR {totalSales}
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700">
                  Active Stores
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {activeStores.length}
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700">
                  Active Managers
                </h3>
                <p className="text-2xl font-bold text-orange-600">
                  {activeUsers.length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {Object.entries(salesByStoreDate).map(
                ([storeName, salesByDate]) => {
                  const salesChartData = {
                    labels: Object.keys(salesByDate),
                    datasets: [
                      {
                        label: "Total Sales (PKR)",
                        data: Object.values(salesByDate),
                        backgroundColor: "blue",
                      },
                    ],
                  };

                  return (
                    <div
                      key={storeName}
                      className="p-6 bg-white rounded-lg shadow-md"
                    >
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        {<FormatTitle name={storeName} />} - Sales Overview
                      </h3>
                      <p className="text-md text-gray-600 mb-4">
                        Total Sales:{" "}
                        <b>
                          PKR{" "}
                          {Object.values(salesByDate).reduce(
                            (acc, val) => acc + val,
                            0
                          )}
                        </b>
                      </p>
                      <Bar data={salesChartData} />
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
        <div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
