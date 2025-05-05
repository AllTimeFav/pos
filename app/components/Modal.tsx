import { Form } from "@remix-run/react";
import { useState } from "react";

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  actionData: { success?: boolean; error?: string } | null;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function PasswordModal({ isOpen, onClose, userId, actionData, handleSubmit }: PasswordModalProps) {
  const [password, setPassword] = useState("");

  if (!isOpen) return null; // Don't render if not open

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <Form method="post" className="bg-white p-6 rounded-lg shadow-lg w-96" onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold mb-3">🔒 Enter Password</h2>
        
        <input type="hidden" name="userId" value={userId} />
        
        <input
          type="password"
          name="password"
          className="w-full border p-2 rounded-lg mb-3"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        {/* Display error from actionData */}
        {actionData?.error && <p className="text-red-500 text-sm mb-3">{actionData.error}</p>}
        
        <div className="flex justify-end gap-3">
          <button 
            type="button"
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
