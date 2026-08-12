"use client";

import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";

interface WorkspaceContextType {
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaceId: "",
  setWorkspaceId: () => { },
});

export function WorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [workspaceId, setWorkspaceIdState] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_active_workspace_id");
      if (saved) {
        setWorkspaceIdState(saved);
      }
    }
  }, []);

  const setWorkspaceId = (id: string) => {
    setWorkspaceIdState(id);
    if (typeof window !== "undefined" && id) {
      localStorage.setItem("crm_active_workspace_id", id);
    }
  };

  return React.createElement(
    WorkspaceContext.Provider,
    {
      value: {
        workspaceId,
        setWorkspaceId,
      },
    },
    children
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}