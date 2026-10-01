"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* =========================================================
   TYPES
   ========================================================= */

type RequestType =
  | "CANCELLATION"
  | "REFUND"
  | "REPLACEMENT";

type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

type ActionType =
  | "APPROVE"
  | "REJECT";

type OrderRequest = {
  id: number;
  order_id: number;
  user_id: number;

  request_type: RequestType;
  reason: string;
  details?: string | null;

  refund_amount?: number | string | null;
  replacement_details?: string | null;

  status: RequestStatus;
  admin_note?: string | null;

  created_at: string;
  updated_at: string;

  order_number: string;
  order_total: number | string;
  order_status: string;
  payment_status: string;
  payment_method: string;

  customer_name: string;
  customer_email: string;
};


/* =========================================================
   REQUEST TYPE BADGE
   ========================================================= */

function RequestTypeBadge({
  type
}: {
  type: RequestType;
}) {
  const config = {
    CANCELLATION: {
      label: "Cancellation",
      icon: "×",
      className:
        "bg-danger-subtle text-danger-emphasis border-danger-subtle"
    },

    REFUND: {
      label: "Refund",
      icon: "₹",
      className:
        "bg-warning-subtle text-warning-emphasis border-warning-subtle"
    },

    REPLACEMENT: {
      label: "Replacement",
      icon: "↻",
      className:
        "bg-primary-subtle text-primary-emphasis border-primary-subtle"
    }
  };

  const item = config[type];

  return (
    <span
      className={`badge rounded-pill border px-3 py-2 fw-semibold ${item.className}`}
    >
      <span className="me-1">
        {item.icon}
      </span>

      {item.label}
    </span>
  );
}


/* =========================================================
   STATUS BADGE
   ========================================================= */

function RequestStatusBadge({
  status
}: {
  status: RequestStatus;
}) {
  const config = {
    PENDING:
      "bg-warning-subtle text-warning-emphasis border-warning-subtle",

    APPROVED:
      "bg-success-subtle text-success-emphasis border-success-subtle",

    REJECTED:
      "bg-danger-subtle text-danger-emphasis border-danger-subtle",

    COMPLETED:
      "bg-primary-subtle text-primary-emphasis border-primary-subtle"
  };

  return (
    <span
      className={`badge rounded-pill border px-3 py-2 fw-semibold ${config[status]}`}
    >
      {status}
    </span>
  );
}


/* =========================================================
   REQUEST TYPE FILTER BUTTON
   ========================================================= */

function RequestFilterButton({
  active,
  label,
  count,
  onClick
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`btn rounded-3 px-3 py-2 fw-semibold ${
        active
          ? "btn-primary shadow-sm"
          : "btn-light border text-dark"
      }`}
      onClick={onClick}
    >
      {label}

      {count !== undefined && (
        <span
          className={`ms-2 badge rounded-pill ${
            active
              ? "bg-white text-primary"
              : "bg-primary-subtle text-primary"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}


/* =========================================================
   PAGE
   ========================================================= */

export default function AdminOrderRequestsPage() {

  /* =======================================================
     STATE
     ======================================================= */

  const [requests, setRequests] =
    useState<OrderRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedRequest, setSelectedRequest] =
    useState<OrderRequest | null>(null);

  const [requestTypeFilter, setRequestTypeFilter] =
    useState<"ALL" | RequestType>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | RequestStatus>("ALL");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [rowsPerPage, setRowsPerPage] =
    useState(10);

  /* =======================================================
     ACTION STATE
     ======================================================= */

  const [processingAction, setProcessingAction] =
    useState<ActionType | null>(null);

  const [actionError, setActionError] =
    useState("");

  const [adminNote, setAdminNote] =
    useState("");


  /* =======================================================
     LOAD REQUESTS
     ======================================================= */

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/order-requests",
        {
          cache: "no-store"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not load order requests."
        );
      }

      setRequests(data.requests || []);

    } catch (error: any) {
      console.error(error);

      setError(
        error?.message ||
        "Could not load order requests."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadRequests();
  }, []);


  /* =======================================================
     APPROVE / REJECT REQUEST
     ======================================================= */

  const handleRequestAction = async (
    action: ActionType
  ) => {
    if (!selectedRequest) {
      return;
    }

    setProcessingAction(action);
    setActionError("");

    try {
      const response = await fetch(
        `/api/admin/order-requests/${selectedRequest.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            action,
            adminNote: adminNote.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not process the request."
        );
      }

      /*
       * Refresh request list after action
       */
      const refreshResponse = await fetch(
        "/api/admin/order-requests",
        {
          cache: "no-store"
        }
      );

      const refreshData =
        await refreshResponse.json();

      if (!refreshResponse.ok) {
        throw new Error(
          refreshData.error ||
          "Request processed, but the list could not be refreshed."
        );
      }

      setRequests(
        refreshData.requests || []
      );

      /*
       * Close modal after successful action
       */
      setSelectedRequest(null);

      setAdminNote("");
      setActionError("");

    } catch (error: any) {
      console.error(
        "Order request action error:",
        error
      );

      setActionError(
        error?.message ||
        "Something went wrong while processing the request."
      );

    } finally {
      setProcessingAction(null);
    }
  };


  /* =======================================================
     COUNTS
     ======================================================= */

  const pendingCount =
    requests.filter(
      (request) =>
        request.status === "PENDING"
    ).length;

  const approvedCount =
    requests.filter(
      (request) =>
        request.status === "APPROVED"
    ).length;

  const rejectedCount =
    requests.filter(
      (request) =>
        request.status === "REJECTED"
    ).length;

  const cancellationCount =
    requests.filter(
      (request) =>
        request.request_type === "CANCELLATION"
    ).length;

  const refundCount =
    requests.filter(
      (request) =>
        request.request_type === "REFUND"
    ).length;

  const replacementCount =
    requests.filter(
      (request) =>
        request.request_type === "REPLACEMENT"
    ).length;


  /* =======================================================
     FILTER REQUESTS
     ======================================================= */

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {

      const matchesType =
        requestTypeFilter === "ALL" ||
        request.request_type ===
          requestTypeFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        request.status === statusFilter;

      return (
        matchesType &&
        matchesStatus
      );
    });
  }, [
    requests,
    requestTypeFilter,
    statusFilter
  ]);


  /* =======================================================
     PAGINATION
     ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRequests.length /
        rowsPerPage
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) *
    rowsPerPage;

  const endIndex =
    startIndex + rowsPerPage;

  const paginatedRequests =
    filteredRequests.slice(
      startIndex,
      endIndex
    );


  /* =======================================================
     RESET PAGE WHEN FILTER CHANGES
     ======================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    requestTypeFilter,
    statusFilter,
    rowsPerPage
  ]);


  /* =======================================================
     PAGINATION NUMBERS
     ======================================================= */

  const pageNumbers = Array.from(
    {
      length: totalPages
    },
    (_, index) =>
      index + 1
  );


  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <main
        className="min-vh-100 py-4"
        style={{
          background:
            "linear-gradient(180deg,#f4f8ff 0%,#ffffff 55%,#f7fbff 100%)"
        }}
      >

        <div className="container-fluid px-3 px-lg-4">

          <div
            className="rounded-4 p-4 p-lg-5 mb-4 shadow-sm"
            style={{
              background:
                "linear-gradient(135deg,#0d6efd,#2563eb)",
              minHeight: "160px"
            }}
          >

            <div className="placeholder-glow">
              <span className="placeholder col-4 bg-white"></span>
            </div>

            <div className="placeholder-glow mt-3">
              <span className="placeholder col-6 bg-white"></span>
            </div>

          </div>


          <div className="row g-4">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  className="col-12 col-md-6 col-xl-3"
                  key={item}
                >

                  <div className="card border-0 shadow-sm rounded-4">

                    <div className="card-body p-4">

                      <div className="placeholder-glow">

                        <span className="placeholder col-5 mb-3"></span>

                        <span className="placeholder col-8 d-block"></span>

                        <span className="placeholder col-4 d-block mt-2"></span>

                      </div>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </main>
    );
  }


  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <main
      className="min-vh-100 py-4"
      style={{
        background:
          "linear-gradient(180deg,#f3f7ff 0%,#ffffff 42%,#f8fbff 100%)"
      }}
    >

      <div className="container-fluid px-3 px-lg-4">


        {/* =================================================
            HEADER
            ================================================= */}

        <section
          className="rounded-4 shadow-sm overflow-hidden mb-4"
          style={{
            background: "#23668d"
          }}
        >

          <div className="p-4 p-lg-5">

            <div className="row align-items-center g-4">

              <div className="col">

                <div
                  className="small fw-bold text-uppercase mb-2"
                  style={{
                    color:
                      "rgba(255,255,255,.75)",
                    letterSpacing: "1.2px"
                  }}
                >
                  Aurora Control
                </div>

                <h1 className="fw-bold mb-2 text-white">
                  Order Requests
                </h1>

                <p
                  className="mb-0"
                  style={{
                    color:
                      "rgba(255,255,255,.82)"
                  }}
                >
                  Review and manage customer
                  cancellation, refund and
                  replacement requests.
                </p>

              </div>


              <div className="col-12 col-lg-auto">

                <button
                  type="button"
                  className="btn btn-light rounded-3 px-4 py-2 fw-bold text-primary shadow-sm"
                  onClick={loadRequests}
                  disabled={loading}
                >
                  ↻&nbsp; Refresh Requests
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div
            className="alert alert-danger rounded-4 border-0 shadow-sm mb-4"
          >
            <strong>Error:</strong>{" "}
            {error}
          </div>
        )}


        {/* =================================================
            SUMMARY CARDS
            ================================================= */}

        <section className="mb-4">

          <div className="row g-4">

            {/* TOTAL */}

            <div className="col-12 col-md-6 col-xl-3">

              <div
                className="card h-100 border-0 rounded-4 shadow-sm overflow-hidden"
                style={{
                  background: "#af9667"
                }}
              >

                <div className="card-body p-4">

                  <div className="d-flex justify-content-between align-items-start">

                    <div>

                      <div className="small fw-bold text-uppercase text-dark mb-2">
                        Total Requests
                      </div>

                      <div className="display-6 fw-bold text-dark">
                        {requests.length}
                      </div>

                      <div className="small text-dark mt-2">
                        All customer requests
                      </div>

                    </div>

                    <div
                      className="rounded-4 d-flex align-items-center justify-content-center"
                      style={{
                        width: "54px",
                        height: "54px",
                        background:
                          "linear-gradient(135deg,#0d6efd,#5b9cff)",
                        color: "#fff",
                        fontSize: "24px"
                      }}
                    >
                      ↗
                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* PENDING */}

            <div className="col-12 col-md-6 col-xl-3">

              <div
                className="card h-100 border-0 rounded-4 shadow-sm overflow-hidden"
                style={{
                  background: "#a7c28a"
                }}
              >

                <div className="card-body p-4">

                  <div className="d-flex justify-content-between align-items-start">

                    <div>

                      <div className="small fw-bold text-uppercase text-dark mb-2">
                        Pending
                      </div>

                      <div className="display-6 fw-bold text-dark">
                        {pendingCount}
                      </div>

                      <div className="small text-dark mt-2">
                        Waiting for review
                      </div>

                    </div>

                    <div
                      className="rounded-4 d-flex align-items-center justify-content-center"
                      style={{
                        width: "54px",
                        height: "54px",
                        background:
                          "linear-gradient(135deg,#f59e0b,#fbbf24)",
                        color: "#fff",
                        fontSize: "24px"
                      }}
                    >
                      !
                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* APPROVED */}

            <div className="col-12 col-md-6 col-xl-3">

              <div
                className="card h-100 border-0 rounded-4 shadow-sm overflow-hidden"
                style={{
                  background: "#8968aa"
                }}
              >

                <div className="card-body p-4">

                  <div className="d-flex justify-content-between align-items-start">

                    <div>

                      <div className="small fw-bold text-uppercase text-dark mb-2">
                        Approved
                      </div>

                      <div className="display-6 fw-bold text-dark">
                        {approvedCount}
                      </div>

                      <div className="small text-dark mt-2">
                        Requests approved
                      </div>

                    </div>

                    <div
                      className="rounded-4 d-flex align-items-center justify-content-center"
                      style={{
                        width: "54px",
                        height: "54px",
                        background:
                          "linear-gradient(135deg,#198754,#42c47c)",
                        color: "#ffffff",
                        fontSize: "24px"
                      }}
                    >
                      ✓
                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* PROCESSED */}

            <div className="col-12 col-md-6 col-xl-3">

              <div
                className="card h-100 border-0 rounded-4 shadow-sm overflow-hidden"
                style={{
                  background: "#fd9e9e"
                }}
              >

                <div className="card-body p-4">

                  <div className="d-flex justify-content-between align-items-start">

                    <div>

                      <div className="small fw-bold text-uppercase text-dark mb-2">
                        Processed
                      </div>

                      <div className="display-6 fw-bold text-dark">
                        {approvedCount +
                          rejectedCount}
                      </div>

                      <div className="small text-dark mt-2">
                        Approved or rejected
                      </div>

                    </div>

                    <div
                      className="rounded-4 d-flex align-items-center justify-content-center"
                      style={{
                        width: "54px",
                        height: "54px",
                        background:
                          "linear-gradient(135deg,#6f42c1,#9b6de3)",
                        color: "#fff",
                        fontSize: "24px"
                      }}
                    >
                      ✓
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            FILTER SECTION
            ================================================= */}

        <section
          className="rounded-4 shadow-sm border-0 mb-4"
          style={{
            background: "#aec0ad"
          }}
        >

          <div className="p-4">

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">

              <div>

                <div className="small text-uppercase fw-bold text-primary mb-1">
                  Request Filters
                </div>

                <h5 className="fw-bold text-dark mb-0">
                  Find requests quickly
                </h5>

              </div>

              <div className="small fw-semibold text-dark">

                Showing{" "}

                {filteredRequests.length === 0
                  ? 0
                  : startIndex + 1}

                –

                {Math.min(
                  endIndex,
                  filteredRequests.length
                )}{" "}

                of{" "}

                {filteredRequests.length}

              </div>

            </div>


            {/* REQUEST TYPE */}

            <div className="mb-3">

              <div className="small fw-bold text-dark mb-2">
                Request Type
              </div>

              <div className="d-flex flex-wrap gap-2">

                <RequestFilterButton
                  active={
                    requestTypeFilter ===
                    "ALL"
                  }
                  label="All"
                  count={requests.length}
                  onClick={() =>
                    setRequestTypeFilter(
                      "ALL"
                    )
                  }
                />

                <RequestFilterButton
                  active={
                    requestTypeFilter ===
                    "CANCELLATION"
                  }
                  label="Cancellation"
                  count={
                    cancellationCount
                  }
                  onClick={() =>
                    setRequestTypeFilter(
                      "CANCELLATION"
                    )
                  }
                />

                <RequestFilterButton
                  active={
                    requestTypeFilter ===
                    "REFUND"
                  }
                  label="Refund"
                  count={refundCount}
                  onClick={() =>
                    setRequestTypeFilter(
                      "REFUND"
                    )
                  }
                />

                <RequestFilterButton
                  active={
                    requestTypeFilter ===
                    "REPLACEMENT"
                  }
                  label="Replacement"
                  count={
                    replacementCount
                  }
                  onClick={() =>
                    setRequestTypeFilter(
                      "REPLACEMENT"
                    )
                  }
                />

              </div>

            </div>


            {/* STATUS + ROWS */}

            <div className="row align-items-end g-3">

              <div className="col-12 col-lg">

                <label className="small fw-bold text-dark mb-2">
                  Request Status
                </label>

                <select
                  className="form-select rounded-3 border-dark-subtle text-dark fw-semibold"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "ALL"
                        | RequestStatus
                    )
                  }
                >

                  <option value="ALL">
                    All Statuses
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="APPROVED">
                    Approved
                  </option>

                  <option value="REJECTED">
                    Rejected
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                </select>

              </div>


              <div className="col-12 col-sm-6 col-lg-auto">

                <label className="small fw-bold text-dark mb-2">
                  Rows per page
                </label>

                <select
                  className="form-select rounded-3 border-dark-subtle text-dark fw-semibold"
                  value={rowsPerPage}
                  onChange={(e) =>
                    setRowsPerPage(
                      Number(
                        e.target.value
                      )
                    )
                  }
                >

                  <option value={10}>
                    10
                  </option>

                  <option value={20}>
                    20
                  </option>

                  <option value={30}>
                    30
                  </option>

                  <option value={40}>
                    40
                  </option>

                  <option value={50}>
                    50
                  </option>

                </select>

              </div>


              <div className="col-12 col-sm-6 col-lg-auto">

                <button
                  type="button"
                  className="btn btn-outline-dark rounded-3 px-4 fw-semibold w-100"
                  onClick={() => {
                    setRequestTypeFilter(
                      "ALL"
                    );
                    setStatusFilter("ALL");
                    setCurrentPage(1);
                    setRowsPerPage(10);
                  }}
                >
                  Reset Filters
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            TABLE SECTION
            ================================================= */}

        <section
          className="rounded-4 shadow-sm overflow-hidden"
          style={{
            background: "#4d2f8d",
            border:
              "1px solid rgba(13,110,253,.12)"
          }}
        >

          <div
            className="p-4 border-bottom"
            style={{
              backgroundColor: "#9bb6d0"
            }}
          >

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">

              <div>

                <div className="small text-uppercase fw-bold text-primary mb-1">
                  Customer Requests
                </div>

                <h5 className="fw-bold text-dark mb-0">
                  Cancellation / Refund / Replacement
                </h5>

              </div>

              <div className="badge rounded-pill bg-primary-subtle text-primary px-3 py-2">
                {filteredRequests.length} results
              </div>

            </div>

          </div>


          {filteredRequests.length === 0 ? (

            <div className="text-center py-5 px-4">

              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "72px",
                  height: "72px",
                  background: "#fd9e9e",
                  color: "#0d6efd",
                  fontSize: "28px"
                }}
              >
                ✓
              </div>

              <h5 className="fw-bold text-dark">
                No matching requests
              </h5>

              <p className="text-dark mb-3">
                No requests match the selected filters.
              </p>

              <button
                type="button"
                className="btn btn-primary rounded-3 px-4 fw-semibold"
                onClick={() => {
                  setRequestTypeFilter(
                    "ALL"
                  );
                  setStatusFilter("ALL");
                }}
              >
                Clear Filters
              </button>

            </div>

          ) : (

            <div className="table-responsive">

              <table className="table align-middle mb-0">

                <thead
                  style={{
                    backgroundColor:
                      "#5b7eab"
                  }}
                >

                  <tr>

                    <th className="px-4 py-3 text-dark small fw-bold text-uppercase">
                      Customer
                    </th>

                    <th className="py-3 text-dark small fw-bold text-uppercase">
                      Order
                    </th>

                    <th className="py-3 text-dark small fw-bold text-uppercase">
                      Request
                    </th>

                    <th className="py-3 text-dark small fw-bold text-uppercase">
                      Reason
                    </th>

                    <th className="py-3 text-dark small fw-bold text-uppercase">
                      Amount
                    </th>

                    <th className="py-3 text-dark small fw-bold text-uppercase">
                      Status
                    </th>

                    <th className="py-3 text-end px-4 text-dark small fw-bold text-uppercase">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {paginatedRequests.map(
                    (request) => (

                      <tr
                        key={request.id}
                        style={{
                          transition:
                            "background-color .2s ease"
                        }}
                      >

                        <td className="px-4">

                          <div className="d-flex align-items-center gap-3">

                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                              style={{
                                width: "42px",
                                height: "42px",
                                background:
                                  "#3ab7a9",
                                color: "#0d6efd"
                              }}
                            >
                              {request.customer_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "C"}
                            </div>

                            <div>

                              <div className="fw-bold text-dark">
                                {
                                  request.customer_name
                                }
                              </div>

                              <div className="small text-dark">
                                {
                                  request.customer_email
                                }
                              </div>

                            </div>

                          </div>

                        </td>


                        <td>

                          <Link
                            href={`/orders/${request.order_number}`}
                            className="text-decoration-none"
                          >

                            <div
                              className="fw-bold"
                              style={{
                                color:
                                  "#0d6efd"
                              }}
                            >
                              {
                                request.order_number
                              }
                            </div>

                            <div className="small text-dark">
                              ₹
                              {Number(
                                request.order_total
                              ).toFixed(2)}
                            </div>

                          </Link>

                        </td>


                        <td>

                          <RequestTypeBadge
                            type={
                              request.request_type
                            }
                          />

                        </td>


                        <td>

                          <div
                            className="fw-semibold text-dark text-truncate"
                            style={{
                              maxWidth:
                                "190px"
                            }}
                            title={
                              request.reason
                            }
                          >
                            {request.reason}
                          </div>

                        </td>


                        <td>

                          {request.request_type ===
                          "REFUND" ? (

                            <span className="fw-bold text-dark">
                              ₹
                              {Number(
                                request.refund_amount ||
                                  0
                              ).toFixed(2)}
                            </span>

                          ) : (

                            <span className="text-dark">
                              —
                            </span>

                          )}

                        </td>


                        <td>

                          <RequestStatusBadge
                            status={
                              request.status
                            }
                          />

                        </td>


                        <td className="text-end px-4">

                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm rounded-3 px-3 fw-bold"
                            onClick={() => {
                              setSelectedRequest(
                                request
                              );

                              setAdminNote(
                                request.admin_note ||
                                  ""
                              );

                              setActionError(
                                ""
                              );
                            }}
                          >
                            View Details
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}


          {/* PAGINATION */}

          {filteredRequests.length > 0 && (

            <div
              className="border-top p-3 p-lg-4"
              style={{
                background: "#bbccd2"
              }}
            >

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">

                <div className="small fw-semibold text-dark">

                  Showing{" "}

                  <span className="fw-bold">
                    {startIndex + 1}
                  </span>

                  {" "}to{" "}

                  <span className="fw-bold">
                    {Math.min(
                      endIndex,
                      filteredRequests.length
                    )}
                  </span>

                  {" "}of{" "}

                  <span className="fw-bold">
                    {filteredRequests.length}
                  </span>

                  {" "}requests

                </div>


                <nav>

                  <ul className="pagination pagination-sm mb-0 gap-1">

                    {/* PREVIOUS */}

                    <li
                      className={`page-item ${
                        safeCurrentPage === 1
                          ? "disabled"
                          : ""
                      }`}
                    >

                      <button
                        type="button"
                        className="page-link rounded-3 px-3 fw-semibold text-dark"
                        disabled={
                          safeCurrentPage === 1
                        }
                        onClick={() =>
                          setCurrentPage(
                            (page) =>
                              Math.max(
                                1,
                                page - 1
                              )
                          )
                        }
                      >
                        Previous
                      </button>

                    </li>


                    {/* PAGE NUMBERS */}

                    {pageNumbers.map(
                      (page) => (

                        <li
                          key={page}
                          className={`page-item ${
                            page ===
                            safeCurrentPage
                              ? "active"
                              : ""
                          }`}
                        >

                          <button
                            type="button"
                            className={`page-link rounded-3 fw-semibold ${
                              page ===
                              safeCurrentPage
                                ? "bg-primary border-primary text-white"
                                : "text-dark"
                            }`}
                            onClick={() =>
                              setCurrentPage(
                                page
                              )
                            }
                          >
                            {page}
                          </button>

                        </li>

                      )
                    )}


                    {/* NEXT */}

                    <li
                      className={`page-item ${
                        safeCurrentPage ===
                        totalPages
                          ? "disabled"
                          : ""
                      }`}
                    >

                      <button
                        type="button"
                        className="page-link rounded-3 px-3 fw-semibold text-dark"
                        disabled={
                          safeCurrentPage ===
                          totalPages
                        }
                        onClick={() =>
                          setCurrentPage(
                            (page) =>
                              Math.min(
                                totalPages,
                                page + 1
                              )
                          )
                        }
                      >
                        Next
                      </button>

                    </li>

                  </ul>

                </nav>

              </div>

            </div>

          )}

        </section>


        {/* =================================================
            DETAILS MODAL
            ================================================= */}

        {selectedRequest && (

          <div
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1055,
              backgroundColor:
                "rgba(8,20,40,.58)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter:
                "blur(8px)",
              padding: "20px"
            }}
          >

            <div
              className="modal-dialog modal-dialog-centered"
              style={{
                maxWidth: "760px",
                width: "100%",
                height:
                  "min(54vh, 560px)",
                margin: "auto"
              }}
            >

              <div
                className="modal-content border-0 rounded-4 shadow-lg overflow-hidden"
                style={{
                  background:
                    "linear-gradient(180deg,#ffffff,#f8fbff)",
                  minHeight: "75vh",
                  maxHeight: "92vh"
                }}
              >

                {/* =================================================
                    MODAL HEADER
                    ================================================= */}

                <div
                  className="modal-header border-0 px-4 py-3 flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg,#0d6efd,#2563eb)"
                  }}
                >

                  <div>

                    <div
                      className="small fw-bold text-uppercase mb-1"
                      style={{
                        color:
                          "rgba(255,255,255,.72)"
                      }}
                    >
                      Aurora Order Request
                    </div>

                    <h5 className="modal-title fw-bold text-white mb-1">
                      Request Details
                    </h5>

                    <div
                      className="small"
                      style={{
                        color:
                          "rgba(255,255,255,.82)"
                      }}
                    >
                      Order #
                      {
                        selectedRequest.order_number
                      }
                    </div>

                  </div>


                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      if (
                        processingAction
                      ) {
                        return;
                      }

                      setSelectedRequest(
                        null
                      );

                      setAdminNote("");
                      setActionError("");
                    }}
                    aria-label="Close"
                    disabled={
                      processingAction !== null
                    }
                  />

                </div>


                {/* =================================================
                    MODAL BODY
                    ================================================= */}

                <div
                  className="modal-body p-4 p-lg-5"
                  style={{
                    overflowY: "auto"
                  }}
                >

                  {/* CUSTOMER CARD */}

                  <div
                    className="rounded-4 p-3 mb-3"
                    style={{
                      background:
                        "#89b99a",
                      border:
                        "2px solid #0a0a0a"
                    }}
                  >

                    <div className="small text-uppercase fw-bold text-primary mb-2">
                      Customer
                    </div>

                    <div className="d-flex align-items-center gap-3">

                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                        style={{
                          width: "44px",
                          height: "44px",
                          background:
                            "linear-gradient(135deg,#0d6efd,#5b9cff)",
                          color: "#fff"
                        }}
                      >
                        {
                          selectedRequest.customer_name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                          "C"
                        }
                      </div>

                      <div>

                        <div className="fw-bold text-dark">
                          {
                            selectedRequest.customer_name
                          }
                        </div>

                        <div className="small text-dark">
                          {
                            selectedRequest.customer_email
                          }
                        </div>

                      </div>

                    </div>

                  </div>


                  {/* REQUEST INFORMATION */}

                  <div className="row g-3 mb-3">

                    <div className="col-12 col-md-6">

                      <div
                        className="rounded-4 p-3 h-100"
                        style={{
                          background:
                            "#9b884f",
                          border:
                            "2px solid #000000"
                        }}
                      >

                        <div className="small text-uppercase fw-bold text-dark mb-2">
                          Request Type
                        </div>

                        <RequestTypeBadge
                          type={
                            selectedRequest.request_type
                          }
                        />

                      </div>

                    </div>


                    <div className="col-12 col-md-6">

                      <div
                        className="rounded-4 p-3 h-100"
                        style={{
                          background:
                            "#7c67a4",
                          border:
                            "2px solid #050810"
                        }}
                      >

                        <div className="small text-uppercase fw-bold text-dark mb-2">
                          Request Status
                        </div>

                        <RequestStatusBadge
                          status={
                            selectedRequest.status
                          }
                        />

                      </div>

                    </div>

                  </div>


                  {/* REASON */}

                  <div
                    className="rounded-4 p-3 mb-3"
                    style={{
                      background:
                        "#8791b7",
                      border:
                        "2px solid #000101"
                    }}
                  >

                    <div className="small text-uppercase fw-bold text-dark mb-2">
                      Reason
                    </div>

                    <div className="fw-bold text-dark">
                      {
                        selectedRequest.reason
                      }
                    </div>

                  </div>


                  {/* DETAILS */}

                  {selectedRequest.details && (

                    <div
                      className="rounded-4 p-3 mb-3"
                      style={{
                        background:
                          "#c0bbe7",
                        border:
                          "2px solid #000000"
                      }}
                    >

                      <div className="small text-uppercase fw-bold text-dark mb-2">
                        Additional Details
                      </div>

                      <div className="text-dark">
                        {
                          selectedRequest.details
                        }
                      </div>

                    </div>

                  )}


                  {/* REFUND */}

                  {selectedRequest.request_type ===
                    "REFUND" && (

                    <div
                      className="rounded-4 p-3 mb-3"
                      style={{
                        background:
                          "linear-gradient(135deg,#effcf5,#ffffff)",
                        border:
                          "2px solid #0c0c0c"
                      }}
                    >

                      <div className="small text-uppercase fw-bold text-dark mb-2">
                        Refund Amount
                      </div>

                      <div className="fs-4 fw-bold text-success">
                        ₹
                        {Number(
                          selectedRequest.refund_amount ||
                            0
                        ).toFixed(2)}
                      </div>

                      <div className="small text-dark mt-1">
                        Order total: ₹
                        {Number(
                          selectedRequest.order_total
                        ).toFixed(2)}
                      </div>

                    </div>

                  )}


                  {/* REPLACEMENT */}

                  {selectedRequest.request_type ===
                    "REPLACEMENT" &&
                    selectedRequest.replacement_details && (

                    <div
                      className="rounded-4 p-3 mb-3"
                      style={{
                        background:
                          "linear-gradient(135deg,#eef5ff,#ffffff)",
                        border:
                          "2px solid #141517"
                      }}
                    >

                      <div className="small text-uppercase fw-bold text-dark mb-2">
                        Replacement Details
                      </div>

                      <div className="text-dark">
                        {
                          selectedRequest
                            .replacement_details
                        }
                      </div>

                    </div>

                  )}


                  {/* EXISTING ADMIN NOTE */}

                  {selectedRequest.admin_note && (
                    <div
                      className="rounded-4 p-3 mb-3"
                      style={{
                        background:
                          "#fff3cd",
                        border:
                          "2px solid #664d03"
                      }}
                    >

                      <div className="small text-uppercase fw-bold text-dark mb-2">
                        Existing Admin Note
                      </div>

                      <div className="text-dark">
                        {
                          selectedRequest.admin_note
                        }
                      </div>

                    </div>
                  )}


                  {/* ORDER INFORMATION */}

                  <div
                    className="rounded-4 p-3"
                    style={{
                      background:
                        "#dee2e7",
                      border:
                        "2px solid #020202"
                    }}
                  >

                    <div className="small text-uppercase fw-bold text-primary mb-3">
                      Order Information
                    </div>

                    <div className="row g-3">

                      <div className="col-6 col-md-3">

                        <div className="small text-dark">
                          Order Status
                        </div>

                        <div className="fw-bold text-dark">
                          {
                            selectedRequest.order_status
                          }
                        </div>

                      </div>


                      <div className="col-6 col-md-3">

                        <div className="small text-dark">
                          Payment
                        </div>

                        <div className="fw-bold text-dark">
                          {
                            selectedRequest.payment_status
                          }
                        </div>

                      </div>


                      <div className="col-6 col-md-3">

                        <div className="small text-dark">
                          Method
                        </div>

                        <div className="fw-bold text-dark">
                          {
                            selectedRequest.payment_method
                          }
                        </div>

                      </div>


                      <div className="col-6 col-md-3">

                        <div className="small text-dark">
                          Order Total
                        </div>

                        <div className="fw-bold text-dark">
                          ₹
                          {Number(
                            selectedRequest.order_total
                          ).toFixed(2)}
                        </div>

                      </div>

                    </div>

                  </div>


                  {/* ADMIN NOTE */}

                  {selectedRequest.status ===
                    "PENDING" && (

                    <div className="mt-4">

                      <label className="form-label fw-bold text-dark">
                        Admin Note
                      </label>

                      <textarea
                        className="form-control rounded-3"
                        rows={3}
                        placeholder="Add a note for the customer..."
                        value={adminNote}
                        disabled={
                          processingAction !== null
                        }
                        onChange={(e) =>
                          setAdminNote(
                            e.target.value
                          )
                        }
                      />

                      <div className="form-text">
                        This note will be saved with the request.
                      </div>

                    </div>

                  )}


                  {/* ACTION ERROR */}

                  {actionError && (

                    <div
                      className="alert alert-danger rounded-3 mt-3 mb-0"
                      role="alert"
                    >
                      <strong>
                        Action failed:
                      </strong>{" "}
                      {actionError}
                    </div>

                  )}


                  {/* VIEW ORDER */}

                  <div className="mt-3">

                    <Link
                      href={`/orders/${selectedRequest.order_number}`}
                      className="btn btn-outline-primary rounded-3 px-4 fw-bold"
                      onClick={() => {
                        if (
                          processingAction
                        ) {
                          return;
                        }

                        setSelectedRequest(
                          null
                        );

                        setAdminNote("");
                        setActionError("");
                      }}
                    >
                      View Full Order
                    </Link>

                  </div>

                </div>


                {/* =================================================
                    MODAL FOOTER
                    ================================================= */}

                <div
                  className="modal-footer border-top px-4 py-3 flex-shrink-0"
                  style={{
                    background:
                      "#90a0aa"
                  }}
                >

                  <button
                    type="button"
                    className="btn btn-light border rounded-3 px-4 fw-semibold text-dark"
                    onClick={() => {
                      if (
                        processingAction
                      ) {
                        return;
                      }

                      setSelectedRequest(
                        null
                      );

                      setAdminNote("");
                      setActionError("");
                    }}
                    disabled={
                      processingAction !== null
                    }
                  >
                    Close
                  </button>


                  {selectedRequest.status ===
                    "PENDING" && (

                    <>

                      {/* REJECT */}

                      <button
                        type="button"
                        className="btn btn-outline-danger rounded-3 px-4 fw-bold"
                        disabled={
                          processingAction !==
                          null
                        }
                        onClick={() =>
                          handleRequestAction(
                            "REJECT"
                          )
                        }
                      >

                        {processingAction ===
                        "REJECT" ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              aria-hidden="true"
                            />
                            Rejecting...
                          </>
                        ) : (
                          "Reject"
                        )}

                      </button>


                      {/* APPROVE */}

                      <button
                        type="button"
                        className="btn btn-success rounded-3 px-4 fw-bold"
                        disabled={
                          processingAction !==
                          null
                        }
                        onClick={() =>
                          handleRequestAction(
                            "APPROVE"
                          )
                        }
                      >

                        {processingAction ===
                        "APPROVE" ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              aria-hidden="true"
                            />
                            Approving...
                          </>
                        ) : (
                          "Approve"
                        )}

                      </button>

                    </>

                  )}

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}