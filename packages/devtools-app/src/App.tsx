import React from 'react';
import './App.css';
import { useSelector } from "@typesafe-store/react"
import { routeSelector } from './store/selectors/generated/app-gen';
import { ActionsList } from './components/ActionsList';
import AppLayout from './layout/AppLayout';

function App() {
  const route = useSelector(routeSelector)
  let comp: React.ReactNode = null
  if (route === "actions") {
    comp = <ActionsList />
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
