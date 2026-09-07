import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

import ProductForm from "@/components/admin/ProductForm";


export const dynamic = "force-dynamic";


export default async function NewProductPage() {

    const user = await getSession();


    if (!user) {
        redirect("/account");
    }


    if (user.role !== "ADMIN") {
        redirect("/");
    }


    return (
        <main className="py-4 py-lg-5">

            <ProductForm
                mode="create"
            />

        </main>
    );
}