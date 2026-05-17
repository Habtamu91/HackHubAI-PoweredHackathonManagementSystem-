function deriveServiceUrl(port) {
  if (typeof window === "undefined") return `http://localhost:${port}`;

  const { hostname, host, protocol } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://localhost:${port}`;
  }

  if (host.includes(":3000")) {
    return `${protocol}//${host.replace(":3000", `:${port}`)}`;
  }

  // Cursor and similar cloud preview URLs commonly encode the port in the subdomain.
  if (host.includes("3000")) {
    return `${protocol}//${host.replace("3000", String(port))}`;
  }

  return `${protocol}//${hostname}:${port}`;
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || `${deriveServiceUrl(5000)}/api/v1`;
}

export function getSocketUrl() {
  return import.meta.env.VITE_SOCKET_URL || deriveServiceUrl(5000);
}
