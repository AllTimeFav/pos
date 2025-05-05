import {
  Links,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { json, type LinksFunction, type LoaderFunction } from "@remix-run/node";

import "./tailwind.css";
import { getUserFromSession } from "./utils/session.server";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserFromSession(request);
  
  const currentPath = new URL(request.url).pathname;
  const isAuthRoute = ["/", "/auth/forgot_password"].includes(currentPath);

  if (!user && !isAuthRoute) {
    return redirect("/");
  }


  return json({ user });
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <Meta />
      <Links />
    </head>
    <body className="bg-gray-000 font-inter">
      <main className="bg-gray-00 font-inter">{children}</main>
      <ScrollRestoration />
      <Scripts />
    </body>
  </html>
  );
}

export default function App() {
  return <Outlet />;
}
