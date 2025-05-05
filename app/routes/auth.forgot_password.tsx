import { json, type ActionFunction } from "@remix-run/node";
import { Form, useActionData, useNavigate } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";
import bcrypt from "bcryptjs";
import { useEffect } from "react";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) return json({ error: "Email is required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return json({ error: "User not found" });

  const exxstingUser = await prisma.passwordResetRequest.findUnique({ where: { userId: user.id } });
  if (exxstingUser) {
    await prisma.passwordResetRequest.update({
      where: { userId: user.id },
      data: { status: "pending" },
    })
    return json({ success: "Password reset request sent to admin." });
  }
  // Send a password reset request to the admin
  await prisma.passwordResetRequest.create({
    data: {
      userId: user.id,
      status: "pending",
    },
  });

  return json({ success: "Password reset request sent to admin." });
};

export default function RequestPasswordReset() {
  const actionData = useActionData<{ error?: string; success?: string }>();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (actionData?.success) {
      setTimeout(() => {
        navigate("/");
      }, 3000);
    }
  })

  return (
    <div className="max-w-md mx-auto my-10 p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center">Request Password Reset</h2>
      <Form method="post" className="mt-6 space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
        >
          Request Reset
        </button>
      </Form>
      {actionData?.error && <p className="text-red-500 text-center mt-3">{actionData.error}</p>}
      {actionData?.success && <p className="text-green-500 text-center mt-3">{actionData.success}</p>}
    </div>
  );
}