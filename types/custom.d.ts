declare module "*.css"
declare module "chart.js"
declare module "chartjs-adapter-date-fns"

interface User {
  _id: string
  email: string
  username: string
  role: "user" | "admin"
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}
