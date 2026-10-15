export type UserSex = 'M' | 'F' | 'O';

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  birthDate?: string | null;
  weight?: number | null;
  height?: number | null;
  sex?: UserSex | null;
}

export interface CreateUserDTO {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisteredUserResponse {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

export interface UpdateUserAdditionalDataDTO {
  id: string;
  birthDate: string;
  weight: number;
  height: number;
  sex: UserSex;
}
