export async function fetchWithAuth(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  let res = await fetch(input, {
    ...init,
    credentials: "include", 
  });

  
  if (res.status === 401) {
    const refreshRes = await fetch("/api/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      
      res = await fetch(input, {
        ...init,
        credentials: "include",
      });
    }
  }

  return res;
}
