export interface ItemsResponse<T> {
  items?: T[] | null;
}

export type CollectionResponse<T> = T[] | ItemsResponse<T> | null | undefined;

export const toItemsArray = <T>(response: CollectionResponse<T>): T[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.items)) {
    return response.items;
  }

  return [];
};
