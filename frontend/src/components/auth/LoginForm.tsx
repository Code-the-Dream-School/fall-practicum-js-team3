/*
  LoginForm: the sign-in form (Email, Password and a 'Sign in' button).

  What it does:
  1. Checks that both fields are filled in.
  2. Calls login() from the auth store, which sends the credentials to the backend.
  3. On success, sends the user to the main page.
  4. On failure, shows one message under the form. For a wrong login it never says
     whether the email or the password was wrong.
*/
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../services/apiClient'
import { useAuthStore } from '../../hooks/useAuthStore'
import FormField from '../FormField'

// The values the user types into the form
interface LoginFormValues {
  email: string
  password: string
}

export default function LoginForm() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const {
    register, // connects an input to the form
    handleSubmit, // runs our checks first, then calls submitLogin
    setError, // lets us show an error that came from the server
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>()

  async function submitLogin({ email, password }: LoginFormValues) {
    try {
      await login({ email: email.trim(), password })
      navigate('/')
    } catch (err) {
      let message = 'Something went wrong. Please try again.'
      if (err instanceof ApiError && err.status === 401) {
        // The same message for a wrong email and a wrong password, as the API rule requires
        message = 'Email or password is incorrect.'
      } else if (err instanceof ApiError && err.status === 429) {
        message = 'Too many attempts. Please wait a moment and try again.'
      } else if (err instanceof Error) {
        message = err.message
      }
      setError('root.serverError', { message })
    }
  }

  return (
    <form onSubmit={handleSubmit(submitLogin)} noValidate>
      <FormField
        id='email'
        label='Email'
        type='email'
        autoComplete='email'
        error={errors.email}
        registration={register('email', { required: 'Please enter your email.' })}
      />
      <FormField
        id='password'
        label='Password'
        type='password'
        autoComplete='current-password'
        error={errors.password}
        registration={register('password', { required: 'Please enter your password.' })}
      />

      {/* A problem that does not belong to one field, for example a wrong login */}
      {errors.root?.serverError && (
        <p role='alert' className='form-error'>
          {errors.root.serverError.message}
        </p>
      )}

      {/* The button is disabled while the request is running, so it cannot be sent twice */}
      <button type='submit' disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}