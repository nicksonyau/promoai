import OldTownTemplate from "@/components/templates/OldTownTemplate";

export default function PreviewPage({ params, searchParams }: { params: { id: string }, searchParams: any }) {
  // Read values from query params (fallback to defaults)
  const brand = searchParams?.brand || "PromoAI Café";
  const tagline = searchParams?.tagline || "AI-powered Taste of the Future";
  const logo = searchParams?.logo || "/images/logo-sample.png";
  const heroImage = searchParams?.heroImage || "https://source.unsplash.com/1600x900/?coffee";
  const primaryColor = searchParams?.primaryColor || "#6B4226";
  const secondaryColor = searchParams?.secondaryColor || "#C19A6B";
  const about = searchParams?.about || "Serving signature white coffee and local delights with a modern twist.";
  const contact = searchParams?.contact || "Visit us in KL • WhatsApp +6012-3456789";
  const year = new Date().getFullYear();

  return (
    <OldTownTemplate
      logo={logo}
      brand={brand}
      tagline={tagline}
      heroImage={heroImage}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      about={about}
      menuItems={[
        { name: "AI Latte", description: "Creamy latte crafted with precision", image: "https://picsum.photos/300/200?1" },
        { name: "Smart Toast", description: "Golden crispy toast", image: "https://picsum.photos/300/200?2" },
        { name: "Heritage Nasi Lemak", description: "Traditional nasi lemak with sambal", image: "https://picsum.photos/300/200?3" }
      ]}
      contact={contact}
      year={year}
    />
  );
}