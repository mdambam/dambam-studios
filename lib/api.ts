export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T; response: Response }> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important for cookies
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred')
    // @ts-ignore
    error.status = response.status
    throw error
  }

  return { data, response }
}

export async function apiPost<T = any>(
  url: string,
  body: any,
  options: RequestInit = {}
) {
  return apiFetch<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function apiGet<T = any>(url: string, options: RequestInit = {}) {
  return apiFetch<T>(url, {
    ...options,
    method: 'GET',
  })
}
