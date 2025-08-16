import {
  Outlet,
  useLocation,
  useLoaderData,
  useNavigate,
  redirect,
  NavLink,
} from "@remix-run/react";
import { useState } from "react";
import {
  LogOut,
  Package,
  ShoppingCart,
  Users,
  BarChart,
  Home,
  Briefcase,
  User,
  UserCheck,
  Menu,
  X,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { LoaderFunction, json } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { getUserFromSession } from "~/utils/session.server";
import { FormatTitle } from "~/components/FormatTitle";

Chart.register(...registerables);

// **Loader Function to Fetch Store Data**
export const loader: LoaderFunction = async ({ request }) => {
  const manager = await getUserFromSession(request);

  if (!manager) return json({ error: "Manager not found" }, { status: 404 });

  if (manager?.role !== "storeManager") {
    if (manager?.role === "admin") {
      return redirect("/admin/dashboard");
    } if (manager?.role === "cashier") {
      return redirect("/store/cart");
    }
  }

  const storeId = manager.storeId;

  const sales = await prisma.sales.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });

  const cashiers = await prisma.user.findMany({
    where: { role: "cashier", storeId },
  });

  const managers = await prisma.user.findMany({
    where: { storeId: manager.storeId, role: "storeManager" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  const lowStockProducts = await prisma.product.findMany({
    where: { storeId, stock: { lt: 10 } },
    select: { name: true, stock: true },
  });

  return json({ manager, store, sales, cashiers, managers, lowStockProducts });
};

export default function ManagerDashboard() {
  const { manager, store, sales, cashiers, managers, lowStockProducts } =
    useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const salesByDate = sales.reduce((acc: Record<string, number>, sale: any) => {
    const date = new Date(sale.createdAt).toLocaleDateString();
  
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += sale.total;
  
    return acc;
  }, {});

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

  const navLinks = [
    { to: "/store/dashboard", label: "Home", icon: Home },
    { to: "/store/cart", label: "Cart", icon: ShoppingCart },
    { to: "/store/dashboard/sales", label: "Sales Reports", icon: BarChart },
    { to: "/store/dashboard/products", label: "Product Management", icon: Package },
    { to: "/store/dashboard/manage_cashiers", label: "Manage Cashiers", icon: User },
    { to: "/store/dashboard/store_managers", label: "Store Managers", icon: Briefcase },
    { to: "/store/dashboard/resetRequests", label: "Password Reset Requests", icon: UserCheck },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
      className={`fixed top-0 left-0 h-full ${
        isSidebarOpen ? "w-64" : "w-16"
      } bg-gray-900 text-white flex flex-col transition-all duration-300`}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
        <h1 className={`text-lg font-bold ${isSidebarOpen ? "block" : "hidden"}`}>
          Manager Panel
        </h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-300 hover:text-white"
        >
          {isSidebarOpen ? <X size={30} /> : <Menu size={30} />}
        </button>
      </div>

      <nav className="flex-1 mt-4">
        <ul className="space-y-2">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={
                  `flex items-center gap-3 px-4 py-3 rounded-lg ${
                    location.pathname === to
                      ? "bg-gray-800 text-white font-semibold"
                      : "hover:bg-gray-800"
                  }`
                }
              >
                <Icon size={20} />
                <span className={`${isSidebarOpen ? "block" : "hidden"}`}>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-700 mt-auto">
        <button
          onClick={() => navigate("/auth/logout")}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-red-600 hover:bg-gray-800"
        >
          <LogOut size={20} />
          <span className={`${isSidebarOpen ? "block" : "hidden"}`}>Logout</span>
        </button>
      </div>
    </aside>

      <main
        className={`flex-1 p-6 rounded-lg transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-16"
        } bg-gray-100`}
      >
        {location.pathname === "/store/dashboard" && (
          <>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
              <FormatTitle name={store.name} /> Dashboard
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Welcome,{" "}
              <span className="font-semibold">
                {<FormatTitle name={manager.name} />}
              </span>
              ! Here’s what’s happening today:
            </p>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Sales Card */}
              <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-lg shadow-lg flex items-center gap-4">
                <div className="opacity-80 text-3xl">PKR</div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Total Store Sales
                  </h3>
                  <p className="text-3xl font-bold">
                    {sales.reduce((acc: any, sale: any) => acc + sale.total, 0)}{" "}
                    Rs
                  </p>
                </div>
              </div>

              {/* Active Managers Card */}
              <div className="p-6 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-lg shadow-lg flex items-center gap-4">
                <UserCheck size={40} className="opacity-80" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Active Managers
                  </h3>
                  <p className="text-3xl font-bold">{managers.length}</p>
                </div>
              </div>

              {/* Active Cashiers Card */}
              <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-400 text-white rounded-lg shadow-lg flex items-center gap-4">
                <Users size={40} className="opacity-80" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Active Cashiers
                  </h3>
                  <p className="text-3xl font-bold">{cashiers.length}</p>
                </div>
              </div>
            </div>

            {lowStockProducts.length > 0 && (
              <div className="mt-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
                <h3 className="font-semibold">⚠️ Low Stock Alert!</h3>
                <ul className="list-disc list-inside mt-2">
                  {lowStockProducts.map((product: any) => (
                    <li key={product.name}>
                      {product.name}: <strong>{product.stock} left</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 bg-white w-full md:w-3/5 lg:w-3/2 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Sales Chart
              </h3>
              <Bar data={salesChartData} />
            </div>
          </>
        )}
        <Outlet />
      </main>
    </div>
  );
}
