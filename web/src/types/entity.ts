export interface PublicEntity {
    id: string;
    name: string;
    type: 'certifier' | 'partner';
    description?: string;
    website?: string;
    address?: {
        street?: string;
        city: string;
        state?: string;
        postalCode?: string;
        country: string;
    };
    certifiedBy?: string;
}

export interface PublicEntityListResponse {
    data: PublicEntity[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface FetchPublicEntitiesParams {
    page?: number;
    limit?: number;
    type?: 'certifier' | 'partner';
}