"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Upload, X, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCampaignMutations } from "../../../../api/campaignApi";

// ==============================
// Types
// ==============================
interface Product {
  name: string;
  orgPrice: string;
  promoPrice: string;
  img: string;
}

interface CampaignFormData {
  storeId: string;
  type: string;
  title: string;
  description: string;
  bannerImage: string;
  products: Product[];
  cta: {
    whatsapp: string;
    orderUrl: string;
  };
  startDate: string;
  endDate: string;
}

// ==============================
// Constants
// ==============================
const CAMPAIGN_TYPES = [
  { value: "flash-sale", label: "Flash Sale" },
  { value: "seasonal", label: "Seasonal" },
  { value: "bundle", label: "Bundle Deal" },
  { value: "clearance", label: "Clearance" },
  { value: "new-arrival", label: "New Arrival" },
  { value: "limited-edition", label: "Limited Edition" },
  { value: "exclusive", label: "Exclusive" },
];

// ==============================
// Helper: Convert file to base64
// ==============================
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// ==============================
// Main Component
// ==============================
export default function CampaignCreatePage() {
  const { lang } = useParams();
  const router = useRouter();
  const { create, loading: submitting } = useCampaignMutations();

  // Form state
  const [formData, setFormData] = useState<CampaignFormData>({
    storeId: "store_" + Math.random().toString(36).slice(2, 8), // Auto-generate or get from auth
    type: "flash-sale",
    title: "",
    description: "",
    bannerImage: "",
    products: [],
    cta: {
      whatsapp: "",
      orderUrl: "",
    },
    startDate: "",
    endDate: "",
  });

  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ==============================
  // Validation
  // ==============================
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!formData.type) {
      newErrors.type = "Campaign type is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (formData.products.length === 0) {
      newErrors.products = "Add at least one product";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==============================
  // Handlers
  // ==============================
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Banner image must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFormData((prev) => ({ ...prev, bannerImage: base64 }));
      setBannerPreview(base64);
      toast.success("Banner uploaded!");
    } catch (error) {
      toast.error("Failed to upload banner");
    }
  };

  const handleProductImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Product image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const newProducts = [...formData.products];
      newProducts[index].img = base64;
      setFormData((prev) => ({ ...prev, products: newProducts }));
      toast.success("Product image uploaded!");
    } catch (error) {
      toast.error("Failed to upload product image");
    }
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          name: "",
          orgPrice: "",
          promoPrice: "",
          img: "",
        },
      ],
    }));
  };

  const removeProduct = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
    toast.success("Product removed");
  };

  const updateProduct = (index: number, field: keyof Product, value: string) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData((prev) => ({ ...prev, products: newProducts }));
  };

  // ==============================
  // Submit
  // ==============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    try {
      const campaign = await create(formData);
      toast.success("Campaign created successfully!");
      
      // Redirect to campaign preview
      router.push(`/${lang}/promo/${campaign.id}`);
    } catch (error: any) {
      console.error("Create error:", error);
      toast.error(error.message || "Failed to create campaign");
    }
  };

  // ==============================
  // Render
  // ==============================
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${lang}/dashboard/campaign`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Campaigns
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
          <p className="text-gray-600 mt-2">
            Create a new promotional campaign for your store
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Basic Information
            </h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Black Friday Sale 2024"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.type ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {CAMPAIGN_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="text-red-600 text-sm mt-1">{errors.type}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe your campaign..."
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.endDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.endDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Banner Image */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Banner Image
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Banner (Max 5MB)
              </label>
              
              {bannerPreview ? (
                <div className="relative">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, bannerImage: "" }));
                      setBannerPreview("");
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-gray-50 transition">
                  <Upload size={48} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload banner image
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PNG, JPG, WebP up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Products</h2>
                {errors.products && (
                  <p className="text-red-600 text-sm mt-1">{errors.products}</p>
                )}
              </div>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>

            {formData.products.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No products added yet</p>
                <button
                  type="button"
                  onClick={addProduct}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Add your first product
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.products.map((product, index) => (
                  <div
                    key={index}
                    className="p-6 border border-gray-200 rounded-lg relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <X size={20} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Product Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Image
                        </label>
                        {product.img ? (
                          <div className="relative">
                            <img
                              src={product.img}
                              alt={`Product ${index + 1}`}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => updateProduct(index, "img", "")}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-gray-50 transition">
                            <Upload size={32} className="text-gray-400 mb-1" />
                            <span className="text-xs text-gray-600">
                              Upload product image
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleProductImageUpload(e, index)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Name
                          </label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) =>
                              updateProduct(index, "name", e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Product name"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Original Price
                            </label>
                            <input
                              type="text"
                              value={product.orgPrice}
                              onChange={(e) =>
                                updateProduct(index, "orgPrice", e.target.value)
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="99.00"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Promo Price
                            </label>
                            <input
                              type="text"
                              value={product.promoPrice}
                              onChange={(e) =>
                                updateProduct(index, "promoPrice", e.target.value)
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="49.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Call to Action
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={formData.cta.whatsapp}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cta: { ...prev.cta, whatsapp: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+60123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order URL
                </label>
                <input
                  type="url"
                  value={formData.cta.orderUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cta: { ...prev.cta, orderUrl: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://your-store.com/order"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating Campaign...
                </>
              ) : (
                "Create Campaign"
              )}
            </button>

            <Link
              href={`/${lang}/dashboard/campaign`}
              className="px-6 py-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
