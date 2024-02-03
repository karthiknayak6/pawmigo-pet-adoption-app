export interface User {
  user_id: number;
  username: string;
  password_hash: string;
  email: string;
  first_name: string;
  last_name: string;
  salt: string;
}
