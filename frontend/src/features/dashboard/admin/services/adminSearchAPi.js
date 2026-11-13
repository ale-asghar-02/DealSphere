import { api } from '../../../auth/services/authAPI'

// type: "users" | "ads" | "products" | "transactions" | "withdrawals" | "reports" | "support"
export const adminSearch = async (type, q) => {
  const { data } = await api.get("/admin/search", {
    params: { type, q },
  });
  return data;
};