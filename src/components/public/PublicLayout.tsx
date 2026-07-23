import { Outlet, useLocation } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";
import { TrustRibbon } from "./TrustRibbon";
import { PageTransition } from "@/components/PageTransition";
import { AnimatePresence } from "framer-motion";

export function PublicLayout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 overflow-x-hidden w-full">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <TrustRibbon />
      <PublicFooter />
    </div>
  );
}
