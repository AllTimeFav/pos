import { ActionFunction, redirect } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const storeId = formData.get("storeId") as string;

  if (!params.id || !storeId) {
    throw new Response("Invalid product or store", { status: 400 });
  }
  await prisma.product.delete({ where: { id: params.id, storeId } });
  return redirect("/store/dashboard/products");
};
