import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const key = ["favorites", user?.id];

  const { data: ids = [] } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("entry_id");
      if (error) throw error;
      return data.map((r) => r.entry_id);
    },
  });

  const mutation = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user) throw new Error("auth");
      if (ids.includes(entryId)) {
        const { error } = await supabase.from("favorites").delete().eq("entry_id", entryId).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert({ entry_id: entryId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast.error("Couldn't update favourites"),
  });

  const toggle = (entryId: string) => {
    if (!user) {
      toast("Sign in to save favourites");
      navigate({ to: "/auth" });
      return;
    }
    mutation.mutate(entryId);
  };

  return { ids, isFav: (id: string) => ids.includes(id), toggle };
}
