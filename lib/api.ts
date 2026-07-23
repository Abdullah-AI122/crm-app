import { getToken } from "./auth";

export async function apiRequest(
    url: string,
    options: any = {}
) {
    const token = getToken();

    return fetch(
        `http://localhost:4040${url}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...options.headers // preserve any custom headers
            }
        }
    );
}