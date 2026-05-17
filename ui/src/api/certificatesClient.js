const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL;

export async function fetchCertificates(accessToken, query) {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.sortField) params.set("sortField", query.sortField);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);
  if (query.hostName) params.set("hostName", query.hostName);
  if (query.ipAddress) params.set("ipAddress", query.ipAddress);
  if (query.vulnerabilityRating)
    params.set("vulnerabilityRating", query.vulnerabilityRating);
  if (typeof query.vulnerabilityNumericRating === "number") {
    params.set("vulnerabilityNumericRating", String(query.vulnerabilityNumericRating));
  }
  if (typeof query.certificateIsExpired === "boolean") {
    params.set("certificateIsExpired", String(query.certificateIsExpired));
  }
  if (typeof query.port === "number") {
    params.set("port", String(query.port));
  }

  const url = `${API_BASE_URL}/certificates?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch certificates: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
