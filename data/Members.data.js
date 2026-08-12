import { apiRequest } from "@/lib/api";

export async function getMembers(workspaceId, setMembers, setLoading) {
    try {
        const response = await apiRequest(`/api/workspace-members/${workspaceId}`, { method: "GET" });
        const data = await response.json();
        if (response.ok) setMembers(data.members || data);
    } catch (error) {
        console.error("getMembers error:", error);
    } finally {
        if (setLoading) setLoading(false);
    }
}

export async function inviteMember({
    workspaceId,
    userId,
    role,
    setAdding,
    setUserId,
    setRole,
    setShowInvite,
    getMembersData,
}) {
    if (!userId.trim()) return;
    try {
        setAdding(true);
        const response = await apiRequest(`/api/workspace-members/${workspaceId}`, {
            method: "POST",
            body: JSON.stringify({ userId, role }),
        });
        const data = await response.json();
        if (response.ok) {
            setUserId("");
            setRole("member");
            setShowInvite(false);
            if (getMembersData) getMembersData();
        } else {
            console.log(data.message);
        }
    } catch (error) {
        console.error("inviteMember error:", error);
    } finally {
        setAdding(false);
    }
}

export async function removeMember({
    workspaceId,
    memberUserId,
    getMembersData,
}) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
        const response = await apiRequest(`/api/workspace-members/${workspaceId}/${memberUserId}`, { method: "DELETE" });
        if (response.ok) {
            if (getMembersData) getMembersData();
        } else {
            const data = await response.json();
            console.error(data.message);
        }
    } catch (error) {
        console.error("removeMember error:", error);
    }
}
