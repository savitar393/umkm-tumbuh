import { http } from "./http";

export type UserProfile = {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  phone_number: string;
  address: string;
  city: string;
  province: string;
  status: string;
};

export async function getMyProfile(): Promise<UserProfile | null> {
  try {
    const response = await http.get<{ profile: UserProfile }>("/profiles/me", { service: "user" });
    return response.profile;
  } catch {
    return null;
  }
}
