"use client";

export default function PromoTemplate({ title, description, bannerImage, products, cta }: any) {
  return (
    <div className="font-sans text-gray-800">
      <header>
        <img src={bannerImage} className="w-full h-[380px] object-cover" />
      </header>

      <section className="max-w-5xl mx-auto p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-lg text-gray-600">{description}</p>
      </section>

      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {products.map((p: any, i: number) => (
          <div key={i} className="border p-4 rounded-lg shadow-lg text-center">
            <img src={p.img} className="w-full h-48 object-cover rounded-lg" />
            <h3 className="mt-3 font-semibold text-xl">{p.name}</h3>
            <p className="text-gray-500 line-through">RM {p.orgPrice}</p>
            <p className="text-indigo-600 font-bold text-xl">RM {p.promoPrice}</p>
          </div>
        ))}
      </section>

      <footer className="text-center p-8">
        {cta.whatsapp && (
          <a
            href={cta.whatsapp}
            className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold"
          >
            Order via WhatsApp
          </a>
        )}
        {cta.orderUrl && (
          <a
            href={cta.orderUrl}
            className="block mt-4 underline text-indigo-600"
          >
            Order via food delivery →
          </a>
        )}
      </footer>
    </div>
  );
}
