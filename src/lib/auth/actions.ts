"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clearCurrentAuthSession, createAuthSession } from "@/lib/auth/session";
import { sanitizeNextPath } from "@/lib/auth/dal";
import {
  findAuthUserByEmail,
  hasAnyAuthUsers,
  registerAuthUser,
  touchAuthUserLastLogin,
  verifyAuthUserPassword,
} from "@/lib/auth/storage";
import type { AuthActionState } from "@/lib/auth/types";
import { migrateLegacyResumesToUser } from "@/lib/user-storage";

const loginSchema = z.object({
  email: z.email("请输入有效邮箱地址。").transform((value) => value.trim().toLowerCase()),
  password: z.string().trim().min(1, "请输入密码。"),
  remember: z.boolean().default(false),
  next: z.string().optional(),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "请输入至少 2 个字符。"),
  email: z.email("请输入有效邮箱地址。").transform((value) => value.trim().toLowerCase()),
  password: z.string().trim().min(8, "密码至少需要 8 位。"),
  confirmPassword: z.string().trim().min(1, "请再次输入密码。"),
  next: z.string().optional(),
});

function readBooleanField(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export async function loginWithPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: readBooleanField(formData, "remember"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      fields: {
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      },
      message: "请先补全登录信息。",
    };
  }

  const user = await findAuthUserByEmail(parsed.data.email);
  if (!user) {
    return {
      fields: {
        email: "邮箱或密码不正确。",
      },
      message: "邮箱或密码不正确。",
    };
  }

  const passwordValid = await verifyAuthUserPassword(user, parsed.data.password);
  if (!passwordValid) {
    return {
      fields: {
        password: "邮箱或密码不正确。",
      },
      message: "邮箱或密码不正确。",
    };
  }

  await touchAuthUserLastLogin(user.id);
  await createAuthSession(user.id, parsed.data.remember);

  redirect(sanitizeNextPath(parsed.data.next));
}

export async function registerWithPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      fields: {
        name: flattened.name?.[0],
        email: flattened.email?.[0],
        password: flattened.password?.[0],
        confirmPassword: flattened.confirmPassword?.[0],
      },
      message: "请先补全注册信息。",
    };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return {
      fields: {
        confirmPassword: "两次输入的密码不一致。",
      },
      message: "两次输入的密码不一致。",
    };
  }

  const isFirstUser = !(await hasAnyAuthUsers());

  let user;
  try {
    user = await registerAuthUser({
      email: parsed.data.email,
      name: parsed.data.name,
      password: parsed.data.password,
    });
  } catch (error) {
    return {
      fields: {
        email: "该邮箱已经注册。",
      },
      message: error instanceof Error ? error.message : "注册失败。",
    };
  }

  if (isFirstUser) {
    await migrateLegacyResumesToUser(user.id);
  }

  await touchAuthUserLastLogin(user.id);
  await createAuthSession(user.id, true);

  redirect(sanitizeNextPath(parsed.data.next));
}

export async function logoutAction() {
  await clearCurrentAuthSession();
  redirect("/login");
}
