'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const DashboardContext = createContext(null);

export function useDashboard() {
  return useContext(DashboardContext);
}

export default function DashboardProvider({ children }) {
  const [conversationId, setConversationId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshSidebar = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <DashboardContext.Provider value={{
      conversationId,
      setConversationId,
      refreshKey,
      refreshSidebar,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
