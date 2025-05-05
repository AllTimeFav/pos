import { redirect } from "@remix-run/node";
import { createCookie } from "@remix-run/node";
import { LoaderFunction } from "react-router-dom";

const sessionCookie = createCookie("session");

export const loader: LoaderFunction = async () => {
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionCookie.serialize("", { maxAge: 0 }),
    },
  });
};

