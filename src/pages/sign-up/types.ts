export interface SignUpFormState {
  email: string
  password: string
  repeatPassword: string
  error: string | null
  isLoading: boolean
  success: boolean
}
