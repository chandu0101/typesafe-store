import React from 'react';
import './App.css';
import { useSelector } from "@typesafe-store/react"
import { routeSelector } from './store/selectors/generated/app-gen';
import AppLayout from './layout/AppLayout';
import ActionsPage from './pages/ActionsPage';

function App() {
  const route = useSelector(routeSelector)
  let comp: React.ReactNode = null
  console.log("route : ", route);
  if (route === "actions") {
    comp = <ActionsPage />
  } else if (route === "about") {
    comp = <div> State COmp</div>
  }
  return (
    <AppLayout>
      {comp}
    </AppLayout>
  );
}

export default App;
