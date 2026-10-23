/*
  RegisterForm: the sign-up form (Name, Email, Password and a 'Create account' button).

  What it does:
  1. Checks the input in the browser and shows an error under each invalid field.
  2. Sends the data to the backend with registerUser().
  3. On success, sends the user to the login page (registering does not log them in).
  4. On failure, shows the problem: 'email already registered' under the email field,
     or a general message under the form.
*/
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import { registerUser } from '../../services/authApi';
import FormField from '../FormField';

// The values the user types into the form
interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
}

export default function RegisterForm() {
  const navigate = useNavigate();
  const {
    register, // connects an input to the form
    handleSubmit, // runs our checks first, then calls onSubmit
    setError, // lets us show an error that came from the server
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>();

  async function submitRegistration({ name, email, password }: RegisterFormValues) {
    try {
      await registerUser({ name: name.trim(), email: email.trim(), password });
      // The API does not log the user in after registering, so they go to the login page
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // 409 means this email already has an account
        setError('email', { message: 'This email is already registered.' });
      } else if (err instanceof ApiError && err.status === 429) {
        setError('root.serverError', {
          message: 'Too many attempts. Please wait a moment and try again.',
        });
      } else {
        setError('root.serverError', {
          message: err instanceof Error ? err.message : 'Something went wrong.',
        });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(submitRegistration)} noValidate>
      <FormField
        id='name'
        label='Name'
        autoComplete='name'
        error={errors.name}
        registration={register('name', {
          validate: (value) => value.trim().length > 0 || 'Please enter your name.',
          maxLength: { value: 50, message: 'Name must be at most 50 characters.' },
        })}
      />
      <FormField
        id='email'
        label='Email'
        type='email'
        autoComplete='email'
        error={errors.email}
        registration={register('email', {
          required: 'Please enter your email.',
          maxLength: { value: 254, message: 'Email is too long.' },
          pattern: {
            value: /^[^@ ]+@[^@ ]+[.][^@ ]+$/,
            message: 'Please enter a valid email address.',
          },
        })}
      />
      <FormField
        id='password'
        label='Password'
        type='password'
        autoComplete='new-password'
        placeholder='8+ characters'
        error={errors.password}
        registration={register('password', {
          required: 'Please enter a password.',
          minLength: { value: 8, message: 'Password must be at least 8 characters.' },
          maxLength: { value: 128, message: 'Password must be at most 128 characters.' },
        })}
      />

      {/* A problem that does not belong to one field, for example the server is down */}
      {errors.root?.serverError && (
        <p role='alert' className='form-error'>
          {errors.root.serverError.message}
        </p>
      )}

      {/* The button is disabled while the request is running, so it cannot be sent twice */}
      <button type='submit' disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}