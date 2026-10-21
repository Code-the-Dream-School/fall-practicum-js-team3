//User is what the server returns after registration
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}
//RegisterPayload is what we send. The ? on createdAt means that field is optional.
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}