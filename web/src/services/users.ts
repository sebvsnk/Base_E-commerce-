import { apiFetch } from "./http";

export type Address = {
    id: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault: boolean;
};

export type CreateAddressDto = Omit<Address, "id" | "isDefault"> & { isDefault?: boolean };

export async function listAddresses(): Promise<Address[]> {
    return apiFetch<Address[]>("/users/me/addresses");
}

export async function createAddress(data: CreateAddressDto): Promise<Address> {
    return apiFetch<Address>("/users/me/addresses", { method: "POST", body: JSON.stringify(data) });
}
