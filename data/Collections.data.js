import { apiRequest } from "@/lib/api";
export default async function getCollections(moduleId) {
    const res = await apiRequest(
        `/api/collections/${moduleId}`,
        {
            method: "GET",
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch collections");
    }

    return data.collections || [];
}