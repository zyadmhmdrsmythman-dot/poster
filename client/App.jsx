import { Routes, Route, useLocation } from "react-router-dom";
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
import {useUser , useAuth, useClerk } from "@clerk/clerk-react"
import { Toaster } from "react-hot-toast";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {fetchUser} from "./src/features/user/userSlice.js"
import { fetchConnections } from "./src/features/connections/connectionsSlice.js";
import {addMessages} from "./src/features/messages/messsagesSlice.js"
import GroupChat from "./src/pages/GroupChat.jsx"
import AvailableGroups from "./src/pages/AvailableGroups.jsx"
import JoinedGroups from "./src/pages/JoinedGroups.jsx"
import GroupRequestsManager from "./src/pages/GroupRequestsManager.jsx"
import JoinedGroupsChat from "./src/pages/JoinedGroupsChat.jsx"
import AdminRoute from "./src/pages/AdminRoute.jsx"
import socket from "./src/lib/groupSocket.js"

const App = () => {
  const {user} = useUser()
  const {getToken, isLoaded, isSignedIn} = useAuth()
  const {signOut} = useClerk()
  const dispatch = useDispatch()
  const {pathname} = useLocation()
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    const fetchData = async()=>{
      if(user){
       const token = await getToken()
       dispatch(fetchUser(token))
       dispatch(fetchConnections(token))
      }
    }
    fetchData()
  },[user , getToken , dispatch])

  useEffect(()=>{
    pathnameRef.current = pathname
  },[pathname])

  useEffect(() => {
    if (!user?.id) return;

    const eventSource = new EventSource(
      `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/message/${user.id}`
    );

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "message") {
          window.dispatchEvent(new Event("message-received"));
          if (pathnameRef.current === `/messages/${payload.message.from_user_id}`) {
            dispatch(addMessages(payload.message));
          }
        } else if (payload.type === "post") {
          window.dispatchEvent(
            new CustomEvent("post-created", { detail: payload.post })
          );
        }
      } catch (error) {
        console.error("Failed to process incoming message event:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("Message event stream encountered an error:", error);
    };

    return () => eventSource.close();
  }, [user?.id, dispatch]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return undefined;
    let active = true;
    const onAccountSuspended = async (payload) => {
      window.alert(payload?.message || "تم تعليق حسابك");
      await signOut();
    };
    const onSocketConnectError = async (error) => {
      if (error.message?.includes("suspended")) {
        window.alert("هذا الحساب موقوف عن استخدام المنصة");
        await signOut();
      }
    };
    const onPlatformAdminChanged = (payload) => {
      window.dispatchEvent(
        new CustomEvent("platform-admin-changed", { detail: payload })
      );
    };

    const connectSocket = async () => {
      try {
        const token = await getToken();
        if (!active || !token) return;
        socket.auth = { token };
        socket.on("account_suspended", onAccountSuspended);
        socket.on("platform_admin_changed", onPlatformAdminChanged);
        socket.on("connect_error", onSocketConnectError);
        if (socket.connected) socket.disconnect();
        socket.connect();
      } catch (error) {
        console.error("Failed to authenticate realtime connection:", error);
      }
    };

    connectSocket();
    return () => {
      active = false;
      socket.off("account_suspended", onAccountSuspended);
      socket.off("platform_admin_changed", onPlatformAdminChanged);
      socket.off("connect_error", onSocketConnectError);
      socket.disconnect();
    };
  }, [getToken, isLoaded, isSignedIn, signOut, user?.id]);
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
        <Route path="groups" element={<GroupChat />} />
        <Route path="groups/available" element={<AvailableGroups />} />
        <Route path="groups/requests" element={user ?
        <GroupRequestsManager ownerId={user.id} /> : <Login/> } />
        <Route path="groups/joined" element={<JoinedGroups />} />
        <Route path="groups/chat/:groupId" element={<JoinedGroupsChat />} />
        <Route path="admin" element={<AdminRoute />} />
        <Route path="*" element={<NotFund />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
