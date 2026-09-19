export type ApiError = {
  message?: string
}

export type LoginPayload = {
  username: string
  password: string
}

export type RegisterPayload = {
  username: string
  password: string
  phone?: string
  sex?: 'MALE' | 'FEMALE'
}

export type AuthenticationResponse = {
  message?: string
  token?: string
  authenticated?: boolean
}
