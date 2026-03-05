import { SetMetadata } from '@nestjs/common';

export const isPublicRouteKey = 'isPublicRoute';
export const Public = () => SetMetadata(isPublicRouteKey, true);
