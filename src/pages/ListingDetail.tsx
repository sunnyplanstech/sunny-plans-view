import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { optionalAuthApi } from "@/lib/apiClient";
import { DetailLoading, DetailNotFound } from "@/components/listings/DetailShell";
import { USDetailPage, type USListingDetail } from "@/countries/unitedStates/DetailPage";
import { ITDetailPage, type ITListingDetail } from "@/countries/italy/DetailPage";

type DetailResponse =
  | (USListingDetail & { country: "us" })
  | (ITListingDetail & { country: "it" });

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const queryKey = ["listing-detail", id];

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
