import { useState } from "react"
import { authClient, fetchJwtToken } from "@adapters/auth/auth-client"
import { useAuthStore } from "@application/stores/auth.store"

export const RegisterPage = ({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void
}) => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setUser, setToken, setError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsSubmitting(false)
      return
    }

    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    })

    if (error) {
      setError(error.message ?? "Registration failed")
      setIsSubmitting(false)
      return
    }

    if (data?.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      })

      const token = await fetchJwtToken()
      if (token) {
        setToken(token)
      }
    }

    setIsSubmitting(false)
  }

  const error = useAuthStore((s) => s.error)

  return (
    <div className="flex h-full w-full items-center justify-center bg-sao-dark">
      <div className="w-full max-w-md px-4">
        <h1 className="mb-2 text-center font-game text-5xl font-bold text-sao-blue">
          Sword Art Online
        </h1>
        <p className="mb-8 text-center text-sm text-gray-400">
          Create your account
        </p>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-lg border border-sao-blue/20 bg-sao-panel p-6"
        >
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-200">
            Register
          </h2>

          {error && (
            <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-1 block text-sm text-gray-400"
            >
              Username
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-200 outline-none focus:border-sao-blue"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1 block text-sm text-gray-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-200 outline-none focus:border-sao-blue"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1 block text-sm text-gray-400"
            >
              Password (min 8 characters)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-200 outline-none focus:border-sao-blue"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-sao-blue px-4 py-2 font-semibold text-white transition hover:bg-sao-blue/80 disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>

          <p className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sao-blue hover:underline"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
