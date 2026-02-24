import { map, OperatorFunction } from 'rxjs';

export type CollectionResponse<T> = { items?: T[] } | T[];

export function mapCollectionItems<T>(): OperatorFunction<CollectionResponse<T>, T[]> {
  return map((response) => (Array.isArray(response) ? response : response.items ?? []));
}
