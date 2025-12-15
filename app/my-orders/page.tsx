"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";

export default function MyOrdersRedirect() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      router.push(`/my-orders/${user.id}`);
    } else {
      router.push("/auth");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  );
}
