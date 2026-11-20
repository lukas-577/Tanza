import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { prisma } from "@/lib/db";

// Correos de las profesoras/admins (separados por coma). Pueden entrar la primera vez con Google
// y quedan como admin. Cualquier otra persona debe haber sido agregada antes en /admin/students.
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // Sin auto-registro: las cuentas las crea la profesora en /admin/students.
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // Un alumno agregado por email se une a su cuenta de Google la primera vez que entra.
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "student", input: false },
      active: { type: "boolean", defaultValue: true, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Solo se ejecuta cuando entra alguien que NO estaba registrado.
        before: async (user) => {
          if (adminEmails.includes(user.email.toLowerCase())) {
            return { data: { ...user, role: "admin" } };
          }
          throw new APIError("FORBIDDEN", { message: "not_registered" });
        },
      },
    },
  },
  onAPIError: { errorURL: "/login" },
  plugins: [nextCookies()], // debe ir al final
});
