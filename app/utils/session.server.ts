import { createCookie } from "@remix-run/node";
import jwt from "jsonwebtoken";
import { redirect } from "react-router-dom";


export const sessionCookie = createCookie("session", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24,
});

interface AuthPayload {
  id: string;
  storeId: string,
  name: string;
  email: string;
  password: string,
  role: string;
  actice: boolean;
  iat: number;
  exp: number;
}


export const getUserFromSession = async (request: Request) => {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = await sessionCookie.parse(cookieHeader);

  if (!cookie) return null;

  try {
    return jwt.verify(cookie, process.env.JWT_SECRET!) as AuthPayload;
  } catch (error) {
    return null;
  }
};

export const requireAdmin = async (request: Request) => {
  const user = await getUserFromSession(request);
  const role = user?.role;
  if (!user || user.role !== "admin") {
    throw new Response("Unauthorized", { status: 403 });
  }
};

export const requireUser = async (request: Request) => {
  const user = await getUserFromSession(request);
  if (!user) {
    throw redirect("/");
  }
  return user;
};
