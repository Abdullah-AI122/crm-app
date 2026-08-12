import { apiRequest } from "@/lib/api";

export async function getWorkspace(workspaceId, setWorkspace) {
    try {
        const response = await apiRequest(`/api/workspaces/${workspaceId}`, { method: "GET" });
        const data = await response.json();
        if (response.ok) setWorkspace(data.workspace || data);
    } catch (error) {
        console.error("getWorkspace error:", error);
    }
}
