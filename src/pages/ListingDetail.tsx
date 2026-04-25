import { useParams } from "react-router-dom";
import { getCountryAdapter } from "@/countries";
import { DetailNotFound } from "@/components/listings/DetailShell";

const ListingDetail = () => {
  const { id, country, region, province } = useParams<{
    id: string;
    country: string;
    region: string;
    province: string;
  }>();

  const adapter = getCountryAdapter(country);
  if (!adapter || !id || !country) return <DetailNotFound country={country} />;

  const Page = adapter.DetailPage;
  return <Page id={id} country={country} region={region} province={province} />;
};

export default ListingDetail;
