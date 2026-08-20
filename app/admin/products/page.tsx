import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

import ProductManager from "./ProductManager";


// ---------------------------------------------------------
// Admin Products Page
//
// This is a SERVER component.
//
// It protects the entire page before the browser receives it.
// ---------------------------------------------------------

export const dynamic = "force-dynamic";


export default async function AdminProductsPage() {

    // -----------------------------------------------------
    // Get current session
    // -----------------------------------------------------

    const user = await getSession();


    // -----------------------------------------------------
    // User is not logged in
    // -----------------------------------------------------

    if (!user) {
        redirect("/account");
    }


    // -----------------------------------------------------
    // User is logged in but is not an admin
    // -----------------------------------------------------

    if (user.role !== "ADMIN") {
        redirect("/");
    }


    // -----------------------------------------------------
    // User is an ADMIN
    //
    // Now render the client-side product manager.
    // -----------------------------------------------------

    return <ProductManager />;
}