export const uploadImage = async (
  file: File,
  path: string
): Promise<string> => {
  // This function would be implemented server-side or via API route
  // to avoid importing Firebase Storage on the client
  throw new Error("uploadImage must be implemented as a server-side function");
};
