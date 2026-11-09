import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import NotFound from './componat/NotFound/notFound';
import AuthLayout from './layout/autlayou/AuthLayout';
import MainLayout from './layout/mienlayout/meinLayout';
import Login from './page/login/login';
import Register from './page/Register.tex/Register';
import NewFitness from './page/newesFit/newsFit';
import Notification from './page/notficion/Notfication';
import Profile from './page/profel/Profil';
import SuggestedFriendsPage from './page/suggestedFriends/SuggestedFriends';
import Settings from './page/settings/Settings';

const router = createBrowserRouter([
  {path:"/auth", element:<AuthLayout/>, children:[
    {index: true, element:<Navigate to="login" replace />},
      {path:"login",element:<Login/>},
      {path:"register",element:<Register/>},
   ]},
  {path:"/", element:<Navigate to="/auth/login" replace />},
  {path:"/login", element:<Navigate to="/auth/login" replace />},
  {path:"/register", element:<Navigate to="/auth/register" replace />},
   {path:"main",element:<MainLayout/>,
    children:[
      {index: true, element:<Navigate to="new-fitness" />},
      {path:"new-fitness",element:<NewFitness/>},
      {path:"notification",element:<Notification/>},
      {path:"profile",element:<Profile/>},
      {path:"settings",element:<Settings/>}
    ]
   },
  {path:"/feed",element:<MainLayout/>,children:[{index:true,element:<NewFitness/>}]},
  {path:"/suggested-friends",element:<MainLayout/>,children:[{index:true,element:<SuggestedFriendsPage/>}]},
  {path:"/notifications",element:<MainLayout/>,children:[{index:true,element:<Notification/>}]},
  {path:"/profile",element:<MainLayout/>,children:[{index:true,element:<Profile/>}]},
  {path:"/settings",element:<MainLayout/>,children:[{index:true,element:<Settings/>}]},
   {path:"*",element:<NotFound/>},
   
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer aria-label="Notifications" />
    </>
  );
}

export default App
