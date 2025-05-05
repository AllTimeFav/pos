import { Form, useActionData, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";

interface User {
  id: string;
  storeId: string;
  name: string;
  email: string;
  role: string;
  actice: boolean;
  iat: number;
  exp: number;
}

const About = ({ user }: { user: User }) => {
  const actionData = useActionData<{ success?: boolean; error?: string }>();

  const [password, setPassword] = useState("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const openPasswordModal = () => {
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setPassword("");
  };

  useEffect(() => {
    if (actionData?.success) {
      closePasswordModal();
      navigate(`/auth/signup?store=${user.storeId}`);
    }
  }, [actionData]);
  return (
    <div className="p-4">
      {/* Password Modal */}
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <Form
          method="post"
          className="bg-white p-6 rounded-lg shadow-lg max-w-md"
        >
          <h2 className="text-lg font-bold mb-4">Enter Admin Password</h2>
          <input type="hidden" name="adminId" value={user.id} />
          <input
            type="password"
            placeholder="Enter password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
          {actionData?.error && (
            <p className="text-red-500 text-center mt-3">{actionData.error}</p>
          )}
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={closePasswordModal}
              className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default About;
