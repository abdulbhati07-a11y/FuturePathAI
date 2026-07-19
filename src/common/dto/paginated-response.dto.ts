import { ApiProperty } from '@nestjs/swagger';

export class PaginatedMeta {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ type: [Object] })
  data: T[];

  @ApiProperty({ type: PaginatedMeta })
  meta: PaginatedMeta;
}
