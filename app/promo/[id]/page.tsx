"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "../../api/config";

export default function CampaignPreview() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [layout, setLayout] = useState<"simple" | "highlight" | "side-by-side">(
    "highlight"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_URL}/campaign/${id}`);
      const json = await res.json();

      setCampaign(json);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading)
    return <div className="text-center py-20 text-gray-600">Loading campaign...</div>;

  if (!campaign)
    return <div className="text-center py-20 text-red-500">❌ Campaign not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* --- ✅ Banner --- */}
      {campaign.bannerImage && (
        <img
          src={campaign.bannerImage}
          className="w-full rounded-lg shadow-lg"
          alt="Campaign Banner"
        />
      )}

      {/* --- ✅ Campaign Title & Description --- */}
      <div className="mt-6 text-center">
        <h1 className="text-5xl font-bold">{campaign.title}</h1>
        <p className="mt-3 text-gray-600 text-xl">{campaign.description}</p>
      </div>

      {/* --- ✅ Layout Switch --- */}
      <div className="flex justify-center gap-3 mt-6">
        {["highlight", "simple", "side-by-side"].map((l) => (
          <button
            key={l}
            onClick={() => setLayout(l as any)}
            className={`px-4 py-2 rounded-md border ${
              layout === l ? "bg-indigo-600 text-white" : "bg-white text-gray-600"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* --- ✅ Products Display --- */}
      <div className="mt-10 grid gap-6">
        {campaign.products?.map((product: any, index: number) => (
          <div
            key={index}
            className={`p-6 rounded-xl shadow-md bg-white border ${
              layout === "side-by-side"
                ? "flex gap-4 items-center"
                : "block text-center"
            }`}
          >
            <img
              src={product.img}
              className={`rounded-md mx-auto ${
                layout === "side-by-side" ? "w-32" : "w-full"
              }`}
            />

            <div className={layout === "side-by-side" ? "" : "mt-3"}>
              <h3 className="text-2xl font-semibold">{product.name}</h3>

              {/* ✅ Show both old price & promo price */}
              <p className="text-gray-400 line-through">
                RM {product.orgPrice}
              </p>
              <p className="text-green-600 font-bold text-3xl">
                RM {product.promoPrice}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* --- ✅ CTA Buttons --- */}
      <div className="flex flex-col gap-4 mt-12">
        {campaign.cta?.whatsapp && (
          <a
            href={campaign.cta.whatsapp}
            target="_blank"
            className="bg-green-600 text-white py-4 rounded-lg text-center font-semibold text-lg"
          >
            WhatsApp to Order
          </a>
        )}

        {campaign.cta?.orderUrl && (
          <a
            href={campaign.cta.orderUrl}
            target="_blank"
            className="bg-indigo-600 text-white py-4 rounded-lg text-center font-semibold text-lg"
          >
            Order Online
          </a>
        )}
      </div>
    </div>
  );
}
