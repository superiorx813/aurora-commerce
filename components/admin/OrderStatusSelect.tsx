"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderStatusSelectProps = {
    orderId: number;
    status: string | null;
};

const statuses = [
    {
        value: "PLACED",
        label: "Pending",
    },
    {
        value: "CONFIRMED",
        label: "Confirmed",
    },
    {
        value: "PACKED",
        label: "Packed",
    },
    {
        value: "SHIPPED",
        label: "Shipped",
    },
    {
        value: "OUT_FOR_DELIVERY",
        label: "Out for Delivery",
    },
    {
        value: "DELIVERED",
        label: "Delivered",
    },
    {
        value: "CANCELLED",
        label: "Cancelled",
    },
];

export default function OrderStatusSelect({
    orderId,
    status,
}: OrderStatusSelectProps) {
    const router = useRouter();

    /*
     * If the dashboard sends PENDING,
     * convert it back to the actual database
     * value PLACED for the dropdown.
     */
    const initialStatus =
        String(status ?? "PLACED")
            .trim()
            .toUpperCase() === "PENDING"
            ? "PLACED"
            : String(status ?? "PLACED")
                  .trim()
                  .toUpperCase();

    const [selectedStatus, setSelectedStatus] =
        useState(initialStatus);

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");

    const handleChange = async (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const newStatus = event.target.value;

        const previousStatus = selectedStatus;

        setSelectedStatus(newStatus);
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                `/api/admin/orders/${orderId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: newStatus,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to update status."
                );
            }

            setMessage("Updated");

            /*
             * Refresh the server component.
             */
            router.refresh();

            setTimeout(() => {
                setMessage("");
            }, 1500);
        } catch (error) {
            console.error(
                "STATUS UPDATE ERROR:",
                error
            );

            /*
             * Restore previous value.
             */
            setSelectedStatus(previousStatus);

            setMessage("Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={(event) => {
                /*
                 * Prevent the status dropdown click
                 * from behaving like the order link.
                 */
                event.stopPropagation();
            }}
        >

            <select
                value={selectedStatus}
                onChange={handleChange}
                disabled={loading}
                className={`form-select form-select-sm rounded-pill fw-semibold ${getStatusClass(
                    selectedStatus
                )}`}
                style={{
                    minWidth: "165px",
                    cursor: loading
                        ? "wait"
                        : "pointer",
                }}
            >

                {statuses.map((item) => (

                    <option
                        key={item.value}
                        value={item.value}
                    >
                        {item.label}
                    </option>

                ))}

            </select>

            {message && (

                <div
                    className={`small mt-1 ${
                        message === "Updated"
                            ? "text-success"
                            : "text-danger"
                    }`}
                >

                    {message === "Updated"
                        ? "✓ Updated"
                        : "✕ Failed"}

                </div>

            )}

        </div>
    );
}

function getStatusClass(status: string) {
    switch (status) {

        case "PLACED":
            return "bg-warning-subtle text-warning-emphasis";

        case "CONFIRMED":
            return "bg-info-subtle text-info-emphasis";

        case "PACKED":
            return "bg-primary-subtle text-primary-emphasis";

        case "SHIPPED":
            return "bg-primary-subtle text-primary-emphasis";

        case "OUT_FOR_DELIVERY":
            return "bg-info-subtle text-info-emphasis";

        case "DELIVERED":
            return "bg-success-subtle text-success-emphasis";

        case "CANCELLED":
            return "bg-danger-subtle text-danger-emphasis";

        default:
            return "bg-secondary-subtle text-secondary-emphasis";
    }
}