import { useEffect, useState } from "react";
import { Form, Link, redirect, useActionData, useLoaderData } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserFromSession } from "~/utils/session.server";
import { Minus, Moon, Plus, ShoppingCart, Sun } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface User {
  id: string;
  storeId: string;
  name: string;
  role: string;
  active: boolean;
  email: string;
}

interface Receipt {
  id: string;
  userId: string;
  total: number;
  items: CartItem[];
  createdAt: string;
}

interface CartItem extends Product {
  quantity: number;
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserFromSession(request);

  if (user?.role === "admin") {
    return redirect("/admin/dashboard");
  }

  const products = await prisma.product.findMany({
    where: { storeId: user?.storeId },
  });
  const store = await prisma.store.findUnique({ where: { id: user?.storeId } });
  return { products, user, store };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const cartItems = JSON.parse(formData.get("cart") as string) as CartItem[];
  const user = await getUserFromSession(request);

  try {
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await prisma.$transaction(
      cartItems.map((item) =>
        prisma.product.update({
          where: { id: item.id, storeId: user?.storeId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );

    const sale = await prisma.sales.create({
      data: {
        storeId: user?.storeId,
        userId: user?.id,
        total: totalAmount,
        items: cartItems,
      },
    });
    return json({ success: true, receipt: sale });
  } catch (error) {
    return json({ error: "Failed to process order" }, { status: 500 });
  }
};

export default function Cart() {
  const { products, user, store } = useLoaderData<{
    products: Product[];
    user: User;
    store: any;
  }>();
  const actionData = useActionData<{ success: boolean; receipt: Receipt }>();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode on mount
  useEffect(() => {
    const isDark =
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      console.log("Add Dark theme");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newMode;
    });
  };

  useEffect(() => {
    if (actionData?.success) {
      setReceipt({ ...actionData.receipt, items: actionData.receipt.items });
      setCart([]);
    }
  }, [actionData]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
          : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const totalBill = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div
      className={`min-h-screen bg-gray-50 ${
        darkMode ? "bg-gray-900" : ""
      } transition-colors duration-200`}
    >
      <div
        className={`bg-gradient-to-r ${
          darkMode
            ? "from-blue-800 to-blue-900 shadow-lg"
            : "from-blue-600 to-blue-800 "
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <ShoppingCart className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">
                {store.name
                  .split(" ")
                  .map(
                    (word: any) => word.charAt(0).toUpperCase() + word.slice(1)
                  )
                  .join(" ")}
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              {user.role === "storeManager" && (
                <Link
                  to="/store/dashboard"
                  className="text-white hover:text-gray-200 transition font-medium"
                >
                  Manager Dashboard
                </Link>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-white/10 transition"
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-white" />
                ) : (
                  <Moon className="h-5 w-5 text-white" />
                )}
              </button>
              <Link
                to="/auth/logout"
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1
            className={`text-3xl font-bold text-gray-800 ${
              darkMode ? "text-white" : ""
            } `}
          >
            Shopping Cart
          </h1>
          {receipt?.total && (
            <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              {receipt.total.toFixed(2)} Rs
            </span>
          )}
        </div>

        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full p-4 pl-4 pr-12 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-2001 ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  : "bg-white text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>
        </div>

        {searchQuery && (
          <div
            className={`bg-white${
              darkMode ? "bg-gray-800" : ""
            } rounded-lg shadow-md mb-8 transition-colors duration-200`}
          >
            <div className="p-6">
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Search Results
              </h2>
              {filteredProducts.length > 0 ? (
                <ul className="space-y-3">
                  {filteredProducts.map((product) => (
                    <li
                      key={product.id}
                      className={`flex justify-between items-center border-b pb-3 ${
                        darkMode ? "border-gray-700" : ""
                      }`}
                    >
                      <span
                        className={`${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        } `}
                      >
                        {product.name} - {product.price.toFixed(2)} Rs
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Add to Cart
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  No products found.
                </p>
              )}
            </div>
          </div>
        )}

        {cart.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table
              className={`w-full border-collapse ${
                darkMode ? "border-gray-800 bg-gray-800" : "bg-white"
              } transition-colors duration-200`}
            >
              <thead>
                <tr className="dark:bg-gray-700">
                  <th
                    className={`p-4 text-left ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Product
                  </th>
                  <th
                    className={`p-4 text-left ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Price
                  </th>
                  <th
                    className={`p-4 text-left ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Quantity
                  </th>
                  <th
                    className={`p-4 text-left ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Total
                  </th>
                  <th
                    className={`p-4 text-left ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t ${darkMode ? "border-gray-700" : ""}`}
                  >
                    <td
                      className={`p-4 ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {item.name}
                    </td>
                    <td
                      className={`p-2 ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {item.price.toFixed(2)} Rs
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className={`px-2 py-1 rounded-md transition ${
                            darkMode
                              ? "text-gray-200 hover:bg-gray-500 bg-gray-600"
                              : "bg-gray-300 hover:bg-gray-400 text-black"
                          }`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <input
                          type="number"
                          value={item.quantity}
                          min={1}
                          max={item.stock}
                          onChange={(e) =>
                            updateQuantity(item.id, parseInt(e.target.value))
                          }
                          className={`w-16 text-center p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                    ${
                      darkMode
                        ? "text-gray-200 border-gray-600 bg-gray-700"
                        : "text-gray-800"
                    }`}
                        />

                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className={`px-2 py-1 rounded-md transition ${
                            darkMode
                              ? "text-gray-200 hover:bg-gray-500 bg-gray-600 "
                              : "bg-gray-300 hover:bg-gray-400 text-black"
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td
                      className={`px-2 py-1 ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {(item.price * item.quantity).toFixed(2)} Rs
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
            <p
              className={`text-gray-500 text-lg ${
                darkMode ? "text-gray-400" : ""
              }`}
            >
              Your cart is empty.
            </p>
          </div>
        )}

        <div
          className={`fixed bottom-0 left-0 right-0 shadow-lg border-t transition-colors duration-200 ${
            darkMode
              ? "border-gray-700 bg-gray-800"
              : "border-gray-400 bg-white"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h2
                className={`text-2xl font-semibold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Total: {totalBill.toFixed(2)} Rs
              </h2>
              <Form method="post">
                <input type="hidden" name="cart" value={JSON.stringify(cart)} />
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className={`px-8 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                    cart.length === 0
                      ? `${
                          darkMode ? "bg-gray-600" : "bg-gray-400"
                        } cursor-not-allowed text-gray-200`
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  Checkout
                </button>
              </Form>
            </div>
          </div>
        </div>

        {receipt && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div
              className={` ${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-8 rounded-lg shadow-xl w-full max-w-md m-4 transition-colors duration-200`}
            >
              <h2
                className={`text-2xl font-bold mb-6 text-center ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Receipt
              </h2>
              <div className="space-y-2">
                <p
                  className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Salesman: {user.name}
                </p>
                <p
                  className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Date: {new Date(receipt.createdAt).toLocaleString()}
                </p>
              </div>
              <ul className="my-6 space-y-3">
                {receipt.items.map((item) => (
                  <li
                    key={item.id}
                    className={`flex justify-between ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{(item.price * item.quantity).toFixed(2)} Rs</span>
                  </li>
                ))}
              </ul>
              <div
                className={`border-t ${darkMode ? "border-gray-700" : ""} pt-4`}
              >
                <h3
                  className={`text-xl font-semibold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Total: {receipt.total.toFixed(2)} Rs
                </h3>
              </div>
              <button
                onClick={() => setReceipt(null)}
                className="w-full mt-6 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
