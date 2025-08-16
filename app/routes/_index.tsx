import {
  json,
  redirect,
  type ActionFunction,
  type LoaderFunction,
} from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserFromSession, sessionCookie } from "~/utils/session.server";
import { ArrowRight } from "~/components/Icons";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaEnvelope, FaWhatsapp } from "react-icons/fa";

// Smooth scrolling function
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password)
    return json({ error: "All fields are required" });

  const user = await prisma.user.findFirst({
    where: { email },
  });
  if (!user)
    return json({ error: "Invalid email or password" });

  const isValidPassword = bcrypt.compare(password, user.password);
  if (!isValidPassword)
    return json({ error: "Invalid password" });
  if (!user.active) return json({ error: "User is inactive. Please contact the administrator" });

  const token = jwt.sign(
    {
      id: user.id,
      storeId: user.storeId,
      name: user.name,
      email: user.email,
      active: user.active,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );

  let redirectUrl = "/";
  switch (user.role) {
    case "admin":
      redirectUrl = "/admin/dashboard";
      break;
    case "storeManager":
      redirectUrl = `/store/dashboard`;
      break;
    case "cashier":
      redirectUrl = `/store/cart`;
      break;
  }

  return redirect(redirectUrl, {
    headers: {
      "Set-Cookie": await sessionCookie.serialize(token),
    },
  });
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserFromSession(request);
  if (user) {
    let redirectUrl = "/";
    switch (user.role) {
      case "admin":
        redirectUrl = "/admin/dashboard";
        break;
      case "storeManager":
        redirectUrl = `/store/dashboard`;
        break;
      case "cashier":
        redirectUrl = `/store/cart`;
        break;
    }
    return redirect(redirectUrl);
  }
  return null;
};

export default function Index() {
  const actionData = useActionData<{ error?: string }>();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hero Section */}
      <header className="bg-blue-600 text-white py-20 text-center">
        <h1 className="text-4xl font-bold">Effortless Sales & Inventory Management</h1>
        <p className="mt-3 text-lg max-w-2xl mx-auto">
          Manage your store’s sales, track inventory, and streamline your business with our modern POS system.
        </p>
        <button
          onClick={() => scrollToSection("login")}
          className="mt-6 inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 transition duration-300"
        >
          Get Started <ArrowRight className="inline-block ml-2" />
        </button>
      </header>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="bg-white p-6 shadow-md rounded-lg hover:shadow-xl transition duration-300">
          <h3 className="text-xl font-bold">📊 Sales Reports</h3>
          <p className="text-gray-600 mt-2">Generate detailed sales reports for better business insights.</p>
        </div>
        <div className="bg-white p-6 shadow-md rounded-lg hover:shadow-xl transition duration-300">
          <h3 className="text-xl font-bold">🛒 Inventory Tracking</h3>
          <p className="text-gray-600 mt-2">Monitor stock levels and get alerts for low inventory.</p>
        </div>
        <div className="bg-white p-6 shadow-md rounded-lg hover:shadow-xl transition duration-300">
          <h3 className="text-xl font-bold">🔐 Secure Access</h3>
          <p className="text-gray-600 mt-2">User role-based access for admins, managers, and cashiers.</p>
        </div>
      </section>

      {/* Login Form */}
      <section id="login" className="max-w-md mx-auto my-10 p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        <Form method="post" className="mt-6 space-y-4">
          <input
            type="text"
            name="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            Login
          </button>
        </Form>
        {actionData?.error && <p className="text-red-500 text-center mt-3">{actionData.error}</p>}

        <div className="text-center mt-4">
          <Link to="/auth/forgot_password" className="text-blue-600 hover:underline">
            Forgot Password?
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white p-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-around items-center">
          {/* Branding & Copyright */}
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h2 className="text-lg font-semibold">Our Modern POS System</h2>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} All rights reserved.
            </p>
          </div>

          {/* Contact Information */}
          <div className="text-center md:text-left">
            <p className="text-sm">Email: <span className="text-blue-400">anxjs273@gmail.com</span></p>
            <p className="text-sm">WhatsApp: <span className="text-green-400">+92 300 1234567</span></p>
          </div>

          {/* Social Media Icons */}
          <div className="flex space-x-5 mt-4 md:mt-0">
            <a href="#" className="hover:text-[#1877F2] transition duration-300">
              <FaFacebook size={22} />
            </a>
            <a href="#" className="hover:text-[#1DA1F2] transition duration-300">
              <FaTwitter size={22} />
            </a>
            <a href="#" className="hover:text-[#0077B5] transition duration-300">
              <FaLinkedin size={22} />
            </a>
            <a href="#" className="hover:text-[#E4405F] transition duration-300">
              <FaInstagram size={22} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
