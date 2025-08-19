// import React, { useState, createContext, useContext } from 'react'
// import Layout from './components/Layout'
// import Dashboard from './components/Dashboard'
// import Transactions from './components/Transactions'
// import Users from './components/Users'
// import Alerts from './components/Alerts'
// import Settings from './components/Settings'
// import { useRealTimeData, type RealTimeData } from './hooks/useRealTimeData'

// type View = 'dashboard' | 'transactions' | 'users' | 'alerts' | 'settings'

// // Create context for real-time data
// const RealTimeDataContext = createContext<RealTimeData | null>(null)

// // Custom hook to use real-time data context
// export const useRealTimeDataContext = () => {
//   const context = useContext(RealTimeDataContext)
//   if (!context) {
//     throw new Error('useRealTimeDataContext must be used within RealTimeDataProvider')
//   }
//   return context
// }

// const App: React.FC = () => {
//   const [currentView, setCurrentView] = useState<View>('dashboard')
//   const realTimeData = useRealTimeData()

//   const renderView = () => {
//     switch (currentView) {
//       case 'dashboard':
//         return <Dashboard />
//       case 'transactions':
//         return <Transactions />
//       case 'users':
//         return <Users />
//       case 'alerts':
//         return <Alerts />
//       case 'settings':
//         return <Settings />
//       default:
//         return <Dashboard />
//     }
//   }
// return (
//   <RealTimeDataContext.Provider value={realTimeData}>
//    <Layout
//   activeTab={currentView}
//   onTabChange={(tab) => setCurrentView(tab as View)}
// >
//   {renderView()}
// </Layout>

//   </RealTimeDataContext.Provider>
// )

// }

// export default App


// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\client\src\App.tsx
import React, { useState, createContext } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Users from './components/Users';
import Alerts from './components/Alerts';
import Settings from './components/Settings';
import { useRealTimeData, type RealTimeData } from './hooks/useRealTimeData';

type View = 'dashboard' | 'transactions' | 'users' | 'alerts' | 'settings';

// Create context for real-time data
const RealTimeDataContext = createContext<RealTimeData | null>(null);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const realTimeData = useRealTimeData();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'users':
        return <Users />;
      case 'alerts':
        return <Alerts />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <RealTimeDataContext.Provider value={realTimeData}>
      <Layout
        activeTab={currentView}
        onTabChange={(tab) => setCurrentView(tab as View)}
      >
        {renderView()}
      </Layout>
    </RealTimeDataContext.Provider>
  );
};

export default App;