import { LoaderFunction, ActionFunction, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link, useNavigate } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";

// Fetch product data for editing
export const loader: LoaderFunction = async ({ params }) => {
  if (!params.id) throw new Response("Invalid product ID", { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) throw new Response("Not Found", { status: 404 });

  return product;
};

// Handle product updates
export const action: ActionFunction = async ({ request, params }) => {
  if (!params.id) throw new Response("Invalid product ID", { status: 400 });

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string, 10);
  const description = formData.get("description") as string;
  const storeId = formData.get("storeId") as string;

  await prisma.product.update({
    where: { id: params.id, storeId },
    data: { name, price, stock, description },
  });

  return redirect("/store/dashboard/products");
};

export default function EditProduct() {
  const product = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Edit Product</h1>
        
        <Form method="post" className="space-y-4">
          <input type="hidden" name="storeId" value={product.storeId} />
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input 
              type="text" 
              name="name" 
              defaultValue={product.name} 
              required 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (PKR)</label>
            <input 
              type="number" 
              name="price" 
              defaultValue={product.price} 
              required 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
            <input 
              type="number" 
              name="stock" 
              defaultValue={product.stock} 
              required 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea 
              name="description" 
              defaultValue={product.description} 
              required 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400"
            ></textarea>
          </div>

          <div className="flex justify-between">
            <button 
              type="submit" 
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
            >
              Update Product
            </button>
            <button 
              type="button" 
              onClick={() => navigate("/store/dashboard/products")} 
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
            >
              Cancel
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
