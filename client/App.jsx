import { Routes, Route } from "react-router-dom";
import Messages from "./src/pages/Messages";
import Feed from "./src/pages/Feed";
import Chat from "./src/pages/Chat";
import Connections from "./src/pages/Connections";
import Search from "./src/pages/Search";
import Profile from "./src/pages/Profile";
import CreatePost from "./src/pages/CreatePost";
import Settings from "./src/pages/Settings";
import PostDetails from "./src/pages/PostDetails";
import NotificationsPage from "./src/pages/NotificationsPage";
import Layout from "./src/pages/Layout";
import Login from "./src/pages/Login"
import NotFund from "./src/pages/NotFund"
import {useUser , useAuth } from "@clerk/clerk-react"
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

const App = () => {
  const {user} = useUser()
  const {getToken} = useAuth()

  useEffect(() => {
    if(user){
      getToken().then((token)=> console.log(token))
    }
  })
  return (
    <>
    <Toaster />
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Layout />} >
        <Route index element={<Feed />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:userId" element={<Chat />} />
        <Route path="connections" element={<Connections />} />
        <Route path="search" element={<Search />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:profileId" element={<Profile />} />
        <Route path="create-post" element={<CreatePost />} />
        <Route path="settings" element={<Settings />} />
        <Route path="post/:postId" element={<PostDetails />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFund />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
