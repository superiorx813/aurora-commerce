"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


type DeleteProductButtonProps = {
    productId: number;
    productName: string;
};


export default function DeleteProductButton(
    {
        productId,
        productName
    }: DeleteProductButtonProps
) {

    const router = useRouter();

    const [deleting, setDeleting] =
        useState(false);


    async function handleDelete() {

        /* -------------------------------------------------
           CONFIRM DELETE
        ------------------------------------------------- */

        const confirmed = window.confirm(
            `Are you sure you want to delete "${productName}"?`
        );


        if (!confirmed) {

            return;
        }


        try {

            setDeleting(true);


            /* -------------------------------------------------
               DELETE REQUEST
            ------------------------------------------------- */

            const response = await fetch(
                `/api/admin/products/${productId}`,
                {
                    method: "DELETE"
                }
            );


            const data =
                await response.json();


            /* -------------------------------------------------
               HANDLE ERROR
            ------------------------------------------------- */

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to delete product."
                );
            }


            /* -------------------------------------------------
               REFRESH PAGE
            ------------------------------------------------- */

            router.refresh();

        } catch (error) {

            console.error(
                "DELETE PRODUCT ERROR:",
                error
            );


            alert(
                error instanceof Error
                    ? error.message
                    : "Unable to delete product."
            );

        } finally {

            setDeleting(false);
        }
    }


    return (

        <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-sm btn-outline-danger rounded-3"
        >

            {deleting
                ? "Deleting..."
                : "Delete"
            }

        </button>
    );
}