import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { User } from "firebase/auth";

import Authentication from "../src/pages/authentication/authentication.component";
import Header from "./pages/header/header.component";
import InitialPage from "./pages/initial-page/initial-page.component";
import ProteinPage from "./pages/protein-page/protein-page.component";
import SearchPage from "./pages/search-page/search-page.component";
import { setCurrentUser } from "./store/slices/user.slice";
import { onAuthStateChangedListener } from "./utils/firebase/firebase.utils";

import "./App.scss";

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubcribe = onAuthStateChangedListener((user: User | null) => {
      dispatch(setCurrentUser({ email: user?.email }));

      if (user && ["/", "/auth"].includes(location.pathname)) {
        navigate("/search");
      } else if (!user && location.pathname !== "/") {
        navigate("/auth");
      }
    });

    return unsubcribe;
  }, [dispatch, navigate, location]);

  return (
    <Routes>
      <Route path="/" element={<InitialPage />} />
      <Route path="auth" element={<Authentication />} />
      <Route element={<Header />}>
        <Route path="search" element={<SearchPage />} />
        <Route path="protein/:id" element={<ProteinPage />} />
      </Route>
    </Routes>
  );
};

export default App;
