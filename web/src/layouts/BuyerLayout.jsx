import { Outlet, ScrollRestoration } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./BuyerLayout.css";

export default function BuyerLayout() {
  return (
    <>
      <Header />
      <main className="container">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration getKey={(loc) => loc.pathname} />
    </>
  );
}
