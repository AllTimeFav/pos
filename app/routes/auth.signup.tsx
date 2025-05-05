import { json, redirect } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { FormatTitle } from "~/components/FormatTitle";
import { prisma } from "~/utils/prisma.server";
import { getUserFromSession } from "~/utils/session.server";

const signupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["cashier", "storeManager", "admin"]).optional().default("cashier"),
  storeId: z.string().uuid("Invalid store ID"),
});

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData);

  // Validate form data
  const result = signupSchema.safeParse(formObject);
  if (!result.success) {
    return json({ error: result.error.errors[0].message }, { status: 400 });
  }

  const { name, email, password, role, storeId } = result.data;

  // Check if user already exists in the same store
  const existingUser = await prisma.user.findFirst({
    where: { email, storeId },
  });

  if (existingUser) {
    return json({ error: "User already exists in this store" }, { status: 400 });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Create new user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, storeId },
    });
      return redirect("/");

  } catch (error) {
    return json({ error: "Oops! Something went wrong" }, { status: 500 });
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserFromSession(request);
  if (user?.role !== "admin" && user?.role !== "storeManager") {
    return redirect("/auth/login");
  }

  const url = new URL(request.url);
  const storeId = url.searchParams.get("store");

  // Fetch stores from database
  const stores = await prisma.store.findMany({
    select: { id: true, name: true },
  });

  // Find the store with the given ID
  const store = stores.find((s : any) => s.id === storeId);

  // Redirect if storeId is invalid
  if (!store) {
    return redirect("/?error=Invalid store selection");
  }

  return json({ user: user || null, storeName: store.name });
};


export default function Signup() {
  const actionData = useActionData<{ error?: string; success?: string }>();
  const { user, storeName } = useLoaderData<{ user: User | null, storeName: string }>();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("store");

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        {user?.role === "admin"
        ? `Registration for ${storeName.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}`
        : user?.role === "storeManager"
        ? `Registration Form for ${storeName.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}`
        : ""}
      </h2>

      <Form method="post" className="mt-6 space-y-4">
        <input type="hidden" name="storeId" value={storeId || ""} />

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            name="name"
            placeholder="Enter your name"
            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Select Role
          </label>
          <select
            name="role"
            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="cashier">Cashier</option>
            <option value="storeManager">Store Manager</option>
            { user?.role === "admin" && <option value="admin">Admin</option> }
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Sign Up
        </button>
      </Form>

      {actionData?.error && (
        <p className="text-red-500 text-sm mt-3 text-center">
          {actionData.error}
        </p>
      )}
      {actionData?.success && (
        <p className="text-green-500 text-sm mt-3 text-center">
          {actionData.success}
        </p>
      )}
    </div>
  );
}
