"use client";

import { usePathname } from "next/navigation";
import Footer from "./footer/Footer";
import Sidebar from "./sidebar/Sidebar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

  if (isAuthPage) {
    return <div className="h-full">{children}</div>;
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] md:grid-rows-[1fr_auto] md:grid-cols-[18rem_1fr]">
      <Sidebar className="" />
      <main className="row-start-2 md:row-start-1 md:col-start-2 px-4 sm:px-6 lg:px-8 h-full portrait:overflow-x-auto landscape:overflow-x-visible">
        {children}
      </main>
      <Footer className="row-start-3 md:row-start-2 md:col-span-2" />
    </div>
  );
}
