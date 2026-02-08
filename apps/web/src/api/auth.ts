import client from "./client";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>("/auth/me");
  return data;
}

export function logout(): void {
  localStorage.removeItem("token");
}
