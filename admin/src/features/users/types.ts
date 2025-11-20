export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  name?: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
}
