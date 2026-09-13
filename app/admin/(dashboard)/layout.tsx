import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createContainer } from "@/server/config/container";
import { accessCookie } from "@/server/interfaces/http";
import { AdminSidebar } from "./_components/AdminSidebar";
import { AdminTopBar } from "./_components/AdminTopBar";
import { ConfirmProvider } from "./_components/ConfirmDialog";
import { ToastProvider } from "./_components/Toast";

export const dynamic = "force-dynamic";

export default async function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(accessCookie)?.value;
  if (!token) {
    redirect("/admin/login");
  }

  try {
    const container = createContainer();
    const payload = container.tokens.verifyAccess(token);
    await container.getCurrentAdmin.execute(payload.adminId);
  } catch {
    redirect("/admin/login");
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen bg-slate-50 text-slate-950">
          <AdminSidebar />
          <div className="min-h-screen md:pl-64">
            <AdminTopBar />
            <main className="p-3 pt-20 sm:p-4 md:p-6 md:pt-6">{children}</main>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
