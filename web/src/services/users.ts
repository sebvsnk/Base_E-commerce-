import { apiFetch } from "./http";

// TODO: Update Address type to match backend schema
// Backend uses cityId (reference to City model) instead of city/state/country strings
// This requires implementing a city/region selector UI
export type Address = {
    id: string;
    street: string;
    cityId: string; // Backend expects cityId, not city/state/country
    zip: string;
    label?: string;
    contactPhone?: string;
    isDefault: boolean;
};

export type CreateAddressDto = Omit<Address, "id" | "isDefault"> & { isDefault?: boolean };

export async function listAddresses(): Promise<Address[]> {
    return apiFetch<Address[]>("/users/me/addresses");
}

export async function createAddress(data: CreateAddressDto): Promise<Address> {
    return apiFetch<Address>("/users/me/addresses", { method: "POST", body: JSON.stringify(data) });
}

export async function updateAddress(id: string, data: Partial<CreateAddressDto>): Promise<Address> {
    return apiFetch<Address>(`/users/me/addresses/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteAddress(id: string): Promise<void> {
    return apiFetch<void>(`/users/me/addresses/${id}`, { method: "DELETE" });
}
