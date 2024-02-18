export interface Shelter {
  shelter_id: number;
  shelter_name: string;
  username: string;
  email: string;
  password_hash: string;
  salt: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}
