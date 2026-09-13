import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createContainer } from "@/server/config/container";
import { env, getMissingAdminSetup } from "@/server/config/env";
import { accessCookie } from "@/server/interfaces/http";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const token = (await cookies()).get(accessCookie)?.value;
  let hasValidSession = false;
  if (token) {
    try {
      const container = createContainer();
      const payload = container.tokens.verifyAccess(token);
      await container.getCurrentAdmin.execute(payload.adminId);
      hasValidSession = true;
    } catch {}
  }
  if (hasValidSession) {
    redirect("/admin/dashboard");
  }
  const missingSetup = getMissingSetup();

  return (
    <main className="grid min-h-screen place-items-center bg-ves-mist px-4">
      <section className="w-full max-w-md rounded bg-white p-8 shadow-soft">
        <p className="eyebrow">VES Admin</p>
        <h1 className="mt-3 text-3xl font-black">Sign in to manage VES content</h1>
        <p className="mt-3 leading-7 text-ves-ink/68">
          Only the two seeded administrator accounts can manage media, announcements, internships, and social links.
        </p>
        {missingSetup.length > 0 ? (
          <div className="mt-5 rounded border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
            <p className="font-black">Admin setup is incomplete.</p>
            <p className="mt-1">Missing: {missingSetup.join(", ")}. Add them to `.env.local`, then run `npm run prisma:migrate` and `npm run seed`.</p>
          </div>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}

function getMissingSetup() {
  if (env.nodeEnv === "production") {
    return [];
  }

  return getMissingAdminSetup();
}
