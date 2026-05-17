import React, { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { fetchCertificates } from "../api/certificatesClient";
import { loginRequest } from "../msalConfig";

const columns = [
  { key: "HostName", label: "Host Name" },
  { key: "IPAddress", label: "IP Address" },
  { key: "Environment", label: "Environment" },
  { key: "Port", label: "Port" },
  { key: "ExpirationDate", label: "Expiration" },
  { key: "CertificateIsExpired", label: "Expired" },
  { key: "VulnerabilityRating", label: "Vuln Rating" },
  { key: "VulnerabilityNumericRating", label: "Vuln Score" }
];

const serverFilterableColumns = {
  HostName: "hostName",
  IPAddress: "ipAddress",
  VulnerabilityRating: "vulnerabilityRating",
  VulnerabilityNumericRating: "vulnerabilityNumericRating",
  CertificateIsExpired: "certificateIsExpired",
  Port: "port"
};

function CertificatesGrid() {
  const { instance, accounts } = useMsal();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("HostName");
  const [sortOrder, setSortOrder] = useState("asc");

  const [filters, setFilters] = useState({
    hostName: "",
    ipAddress: "",
    vulnerabilityRating: "",
    vulnerabilityNumericRating: "",
    certificateIsExpired: "",
    port: ""
  });

  const account = useMemo(() => accounts[0], [accounts]);

  const loadData = async () => {
    if (!account) return;

    setLoading(true);
    setError(null);

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account
      });

      const query = {
        page,
        sortField,
        sortOrder
      };

      if (filters.hostName) query.hostName = filters.hostName;
      if (filters.ipAddress) query.ipAddress = filters.ipAddress;
      if (filters.vulnerabilityRating)
        query.vulnerabilityRating = filters.vulnerabilityRating;
      if (filters.vulnerabilityNumericRating) {
        query.vulnerabilityNumericRating = Number(filters.vulnerabilityNumericRating);
      }
      if (filters.certificateIsExpired) {
        query.certificateIsExpired = filters.certificateIsExpired === "true";
      }
      if (filters.port) query.port = Number(filters.port);

      const result = await fetchCertificates(tokenResponse.accessToken, query);
      setData(result);
    } catch (e) {
      setError(e.message || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortField, sortOrder, JSON.stringify(filters), account]);

  const handleHeaderClick = (key) => {
    if (sortField === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(key);
      setSortOrder("asc");
    }
  };

  const handleFilterChange = (apiParam, value) => {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      [apiParam]: value
    }));
  };

  const totalPages = data && data.totalPages ? data.totalPages : 1;

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Certificate Inventory</h2>

      {error && <div style={{ color: "red", marginBottom: "0.5rem" }}>{error}</div>}
      {loading && <div>Loading...</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sortField === col.key;
                const sortIndicator = isSorted ? (sortOrder === "asc" ? " ▲" : " ▼") : "";
                return (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col.key)}
                    style={{
                      borderBottom: "1px solid #ccc",
                      padding: "0.5rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {col.label}
                    {sortIndicator}
                  </th>
                );
              })}
            </tr>
            <tr>
              {columns.map((col) => {
                const apiParam = serverFilterableColumns[col.key];
                if (!apiParam) {
                  return (
                    <th key={col.key} style={{ padding: "0.25rem" }}>
                      {/* no server filter */}
                    </th>
                  );
                }

                let inputType = "text";
                if (apiParam === "port" || apiParam === "vulnerabilityNumericRating") {
                  inputType = "number";
                } else if (apiParam === "certificateIsExpired") {
                  inputType = "select";
                }

                return (
                  <th key={col.key} style={{ padding: "0.25rem" }}>
                    {inputType === "select" ? (
                      <select
                        value={filters[apiParam] || ""}
                        onChange={(e) => handleFilterChange(apiParam, e.target.value)}
                      >
                        <option value="">Any</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input
                        type={inputType}
                        value={filters[apiParam] || ""}
                        onChange={(e) => handleFilterChange(apiParam, e.target.value)}
                        style={{ width: "100%" }}
                        placeholder="Filter"
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data &&
              data.data &&
              data.data.map((cert) => (
                <tr key={`${cert.HostName}-${cert.Port}-${cert.Thumbprint}`}>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>
                    {cert.HostName}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>
                    {cert.IPAddress}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>
                    {cert.Environment}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>
                    {cert.Port}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>
                    {cert.ExpirationDate
                      ? new Date(cert.ExpirationDate).toLocaleString()
                      : ""}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>
                    {cert.CertificateIsExpired ? "Yes" : "No"}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>
                    {cert.VulnerabilityRating}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>
                    {cert.VulnerabilityNumericRating}
                  </td>
                </tr>
              ))}
            {!loading && (!data || !data.data || data.data.length === 0) && (
              <tr>
                <td colSpan={columns.length} style={{ padding: "0.5rem", textAlign: "center" }}>
                  No certificates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "0.75rem",
          display: "flex",
          gap: "0.5rem",
          alignItems: "center"
        }}
      >
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
        <span>
          Total records: <strong>{data && data.totalRecords ? data.totalRecords : 0}</strong>
        </span>
      </div>
    </div>
  );
}

export default CertificatesGrid;
