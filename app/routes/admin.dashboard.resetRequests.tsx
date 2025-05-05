import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import bcrypt from "bcryptjs"

export const loader: LoaderFunction = async () => {
  const requests = await prisma.passwordResetRequest.findMany({
    where: { status: "pending", user: { role: "admin" } },
    include: { user: true },
  });
  return json(requests);
};

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
  
    if (!userId) return json({ error: "Invalid request" });
  
    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  
    // Mark request as resolved
    const user = await prisma.passwordResetRequest.update({
      where: { userId },
      data: { status: "completed" },
      include: { user: true },
    });
  
    return json({ success: `Password reset. New password: ${tempPassword}`, user });
  };
  

export default function AdminPasswordRequests() {
  const requests = useLoaderData<typeof loader>();
  const actionData = useActionData<{ success?: string; error?: string, user?: any }>();

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Password Reset Requests for Store Managers</h2>
      <div>{actionData?.success && <p className="text-green-500 text-center">New Password for {actionData.user.user.name} : {actionData.success}</p>} 
      {actionData?.error && <p className="text-red-500 text-center">{actionData.error}</p>}</div>
      {requests.length === 0 ? (
        <p className="text-center text-gray-600">No pending requests</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((req :any) => (
            <li key={req.id} className="p-4 bg-gray-100 rounded-md flex justify-between items-center">
              <span>{req.user.email}</span>
              <Form method="post">
                <input type="hidden" name="userId" value={req.userId} />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Reset Password
                </button>
              </Form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
