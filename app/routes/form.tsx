import { useState } from "react";
import bcrypt from "bcryptjs";
import { ActionFunction } from "@remix-run/node";
import { Form, json, useActionData } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";


interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  userId : string
}
export const action: ActionFunction = async ({
  request,
}: {
  request: Request;
}) => {
  const formData = await request.formData();
  const userId = formData.get("userId") as string;
  const password = formData.get("password") as string;

  if (!password || typeof userId !== "string") {
    return json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { id: userId } });

  if (!user) {
    return json(
      { success: false, error: "Incorrect password" },
      { status: 401 }
    );
  }

  const isValidPassword = await bcrypt.compare(password, user?.password);
  if (!isValidPassword)
    return json({ error: "Invalid password" }, { status: 400 });

  return json({ success: true });
};

export default function PasswordModal({ isOpen, onClose, onVerify, userId }: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const actionData = useActionData<{ success?: boolean; error?: string }>();

  if (!isOpen) return null; // Don't render if not open

  const handlePasswordSubmit = () => {
    if (password === "admin123") { // Replace with real password verification logic
      onVerify();  // Call the callback function
      setPassword("");
      setError("");
      onClose();   // Close modal
    } else {
      setError("Incorrect password. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <Form method="post" className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold mb-3">🔒 Enter Password</h2>
        <input type="hidden" name="userId" value={userId} />
        <input 
          type="password" 
          className="w-full border p-2 rounded-lg mb-3"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {actionData?.error && <p className="text-red-500 text-sm mb-3">{actionData.error}</p>}
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Confirm
          </button>
        </div>
      </Form>
    </div>
  );
}
