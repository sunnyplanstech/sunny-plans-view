import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { optionalAuthApi } from "@/lib/duckdb/api";
import { DetailLoading, DetailNotFound } from "@/components/listings/DetailShell";
import { USDetailPage, type USListingDetail } from "@/countries/unitedStates/DetailPage";
import { ITDetailPage, type ITListingDetail } from "@/countries/italy/DetailPage";
import { useAuth } from "@/hooks/useAuth";

type DetailResponse =
  | (USListingDetail & { country: "us" })
  | (ITListingDetail & { country: "it" });

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // The detail endpoint's payload shape depends on auth identity + paid
  // status (free → "****", premium → real values). The user id covers
  // anon↔logged-in flips; has_active_subscription covers the subscription
  // toggling without a re-login (Stripe webhook between visibility refetches).
  const queryKey = [
    "listing-detail",
    id,
    user?.id ?? null,
    user?.has_active_subscription ?? false,
  ];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => optionalAuthApi<DetailResponse>(`/api/listings/${id}/detail/`),
    enabled: !!id,
  });

  if (!id) return <DetailNotFound />;
  if (isLoading) return <DetailLoading />;
  if (error || !data) return <DetailNotFound />;

  const onPaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  if (data.country === "it") {
    return <ITDetailPage id={id} listing={data} onPaymentSuccess={onPaymentSuccess} />;
  }
  return <USDetailPage id={id} listing={data} onPaymentSuccess={onPaymentSuccess} />;
};

export default ListingDetail;
