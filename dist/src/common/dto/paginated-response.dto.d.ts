export declare class PaginatedMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class PaginatedResponseDto<T> {
    data: T[];
    meta: PaginatedMeta;
}
