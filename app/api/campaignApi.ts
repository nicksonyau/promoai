// File: app/api/campaignApi.ts
/**
 * Frontend API client for Campaign operations
 * Includes React hooks for easy integration
 */

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "./config";

// ==============================
// Types
// ==============================
interface Campaign {
  id: string;
  storeId: string;
  type: string;
  title: string;
  description?: string;
  bannerImage?: string | null;
  bannerImageUrl?: string | null;
  products?: any[];
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  r2Keys?: string[];
}

interface CreateCampaignRequest {
  storeId: string;
  type: string;
  title: string;
  description?: string;
  bannerImage?: string;
  products?: any[];
  cta?: {
    whatsapp?: string;
    orderUrl?: string;
  };
  startDate?: string;
  endDate?: string;
}

interface CampaignResponse {
  success: boolean;
  campaign?: Campaign;
  id?: string;
  error?: string;
  message?: string;
}

interface CampaignListResponse {
  success: boolean;
  campaigns: Campaign[];
}

// ==============================
// API Client
// ==============================
export class CampaignAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  // Helper: Make Request
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || error.message || "Request failed");
    }

    return response.json();
  }

  // List Campaigns
  async list(params?: any): Promise<CampaignListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    const endpoint = `/campaigns${query ? `?${query}` : ""}`;
    return this.request<CampaignListResponse>(endpoint);
  }

  // Get Campaign by ID
  async get(id: string): Promise<Campaign> {
    const response = await this.request<CampaignResponse>(`/campaign/${id}`);
    if (!response.success || !response.campaign) {
      throw new Error(response.error || "Campaign not found");
    }
    return response.campaign;
  }

  // Create Campaign - CUSTOM ROUTE
  async create(data: CreateCampaignRequest): Promise<Campaign> {
    const response = await this.request<CampaignResponse>("/campaign/create", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.success || !response.campaign) {
      throw new Error(response.error || "Failed to create campaign");
    }

    return response.campaign;
  }

  // Update Campaign
  async update(id: string, data: Partial<CreateCampaignRequest>): Promise<Campaign> {
    const response = await this.request<CampaignResponse>(`/campaign/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (!response.success || !response.campaign) {
      throw new Error(response.error || "Failed to update campaign");
    }

    return response.campaign;
  }

  // Delete Campaign
  async delete(id: string): Promise<any> {
    const response = await this.request<any>(`/campaign/delete/${id}`, {
      method: "DELETE",
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to delete campaign");
    }

    return response;
  }
}

// Default API Instance
export const campaignApi = new CampaignAPI();

// ==============================
// React Hooks
// ==============================

// Hook: List campaigns
export function useCampaigns(params?: any) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await campaignApi.list(params);
      setCampaigns(response.campaigns);
    } catch (err: any) {
      setError(err.message || "Failed to load campaigns");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    return load();
  }, [load]);

  return { campaigns, loading, error, refresh };
}

// Hook: Get single campaign
export function useCampaign(id: string | null) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await campaignApi.get(id);
      setCampaign(data);
    } catch (err: any) {
      setError(err.message || "Failed to load campaign");
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    return load();
  }, [load]);

  return { campaign, loading, error, refresh };
}

// Hook: Campaign mutations
export function useCampaignMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreateCampaignRequest) => {
    setLoading(true);
    setError(null);
    try {
      const campaign = await campaignApi.create(data);
      return campaign;
    } catch (err: any) {
      setError(err.message || "Failed to create campaign");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<CreateCampaignRequest>) => {
    setLoading(true);
    setError(null);
    try {
      const campaign = await campaignApi.update(id, data);
      return campaign;
    } catch (err: any) {
      setError(err.message || "Failed to update campaign");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCampaign = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await campaignApi.delete(id);
      return result;
    } catch (err: any) {
      setError(err.message || "Failed to delete campaign");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    create,
    update,
    delete: deleteCampaign,
    loading,
    error,
  };
}